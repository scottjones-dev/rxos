//! Read-only RXOS telemetry gateway.
//!
//! Milestone one deliberately exposes only simulated and recorded providers.
//! No physical CAN transport or transmit API exists.

use std::{
    fmt,
    fs::File,
    future::Future,
    io::{BufRead, BufReader},
    net::SocketAddr,
    path::Path,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
    routing::get,
    Router,
};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::sync::{broadcast, watch, Mutex};

pub const SCHEMA_VERSION: u8 = 1;
pub const UPDATE_INTERVAL: Duration = Duration::from_millis(100);
pub const BROADCAST_CAPACITY: usize = 32;

fn structured_log(event: &str, context: serde_json::Value) {
    println!(
        "{}",
        json!({
            "component": "vehicle-gateway",
            "event": event,
            "context": context
        })
    );
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarningIndicators {
    pub check_engine: bool,
    pub coolant_temperature: bool,
    pub low_fuel: bool,
    pub low_oil_pressure: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VehicleTelemetry {
    pub rpm: f64,
    pub speed_kph: f64,
    pub gear: String,
    pub throttle_percent: f64,
    pub coolant_temp_c: f64,
    pub oil_temp_c: f64,
    pub oil_pressure_kpa: f64,
    pub fuel_percent: f64,
    pub battery_voltage: f64,
    pub warnings: WarningIndicators,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TelemetrySource {
    Simulation,
    Playback,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryEnvelope {
    pub schema_version: u8,
    pub sequence: u64,
    pub captured_at: String,
    pub source: TelemetrySource,
    pub telemetry: VehicleTelemetry,
}

impl TelemetryEnvelope {
    #[must_use]
    pub fn is_valid(&self) -> bool {
        let canonical_timestamp =
            self.captured_at
                .parse::<chrono::DateTime<Utc>>()
                .is_ok_and(|timestamp| {
                    timestamp.to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
                        == self.captured_at
                });
        self.schema_version == SCHEMA_VERSION
            && canonical_timestamp
            && (0.0..=12_000.0).contains(&self.telemetry.rpm)
            && (0.0..=350.0).contains(&self.telemetry.speed_kph)
            && (0.0..=100.0).contains(&self.telemetry.throttle_percent)
            && (-50.0..=180.0).contains(&self.telemetry.coolant_temp_c)
            && (-50.0..=200.0).contains(&self.telemetry.oil_temp_c)
            && (0.0..=1_500.0).contains(&self.telemetry.oil_pressure_kpa)
            && (0.0..=100.0).contains(&self.telemetry.fuel_percent)
            && (0.0..=20.0).contains(&self.telemetry.battery_voltage)
            && matches!(
                self.telemetry.gear.as_str(),
                "R" | "N" | "1" | "2" | "3" | "4" | "5" | "6"
            )
    }
}

pub trait TelemetryProvider: Send {
    fn next_sample(&mut self) -> TelemetryEnvelope;
}

#[derive(Debug)]
pub struct SimulatedProvider {
    started_at: Instant,
    sequence: u64,
}

impl Default for SimulatedProvider {
    fn default() -> Self {
        Self {
            started_at: Instant::now(),
            sequence: 0,
        }
    }
}

impl SimulatedProvider {
    #[must_use]
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    pub fn at_elapsed(elapsed_seconds: f64, sequence: u64) -> TelemetryEnvelope {
        let cycle = elapsed_seconds % 30.0;
        let throttle = (cycle / 4.0).sin().mul_add(72.0, 0.0).max(0.0);
        let speed = (cycle / 19.0).sin().mul_add(165.0, 0.0).max(0.0);
        let gear_index = ((speed / 28.0).floor() as usize).min(6);
        let gears = ["N", "1", "2", "3", "4", "5", "6"];
        let gear = gears[gear_index];
        let rpm = if gear == "N" {
            throttle.mul_add(45.0, 900.0)
        } else {
            throttle.mul_add(16.0, (speed % 28.0).mul_add(230.0, 1_300.0))
        }
        .min(9_000.0);
        let oil_pressure = rpm.mul_add(0.065, 110.0).max(80.0);
        let coolant = elapsed_seconds.mul_add(1.8, 20.0).min(96.0);
        let oil = elapsed_seconds.mul_add(1.55, 20.0).min(108.0);
        let fuel = (78.0 - elapsed_seconds / 1_200.0).max(4.0);

        TelemetryEnvelope {
            schema_version: SCHEMA_VERSION,
            sequence,
            captured_at: Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            source: TelemetrySource::Simulation,
            telemetry: VehicleTelemetry {
                rpm: rpm.round(),
                speed_kph: (speed * 10.0).round() / 10.0,
                gear: gear.to_owned(),
                throttle_percent: (throttle * 10.0).round() / 10.0,
                coolant_temp_c: (coolant * 10.0).round() / 10.0,
                oil_temp_c: (oil * 10.0).round() / 10.0,
                oil_pressure_kpa: oil_pressure.round(),
                fuel_percent: (fuel * 10.0).round() / 10.0,
                battery_voltage: elapsed_seconds.sin().mul_add(0.15, 13.8),
                warnings: WarningIndicators {
                    check_engine: false,
                    coolant_temperature: coolant >= 115.0,
                    low_fuel: fuel <= 10.0,
                    low_oil_pressure: oil_pressure < 100.0 && rpm > 1_500.0,
                },
            },
        }
    }
}

impl TelemetryProvider for SimulatedProvider {
    fn next_sample(&mut self) -> TelemetryEnvelope {
        let sample = Self::at_elapsed(self.started_at.elapsed().as_secs_f64(), self.sequence);
        self.sequence += 1;
        sample
    }
}

#[derive(Debug)]
pub enum PlaybackError {
    Io(std::io::Error),
    InvalidLine { line: usize, reason: String },
    Empty,
}

impl fmt::Display for PlaybackError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(error) => write!(formatter, "could not read recording: {error}"),
            Self::InvalidLine { line, reason } => {
                write!(formatter, "invalid recording at line {line}: {reason}")
            }
            Self::Empty => write!(formatter, "recording contains no samples"),
        }
    }
}

impl std::error::Error for PlaybackError {}

impl From<std::io::Error> for PlaybackError {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}

#[derive(Debug)]
pub struct PlaybackProvider {
    samples: Vec<TelemetryEnvelope>,
    cursor: usize,
    sequence: u64,
}

impl PlaybackProvider {
    /// Load and validate a simulated newline-delimited telemetry recording.
    ///
    /// # Errors
    ///
    /// Returns [`PlaybackError`] when the file cannot be read, is empty, or a
    /// line does not satisfy telemetry schema version one.
    pub fn from_path(path: &Path) -> Result<Self, PlaybackError> {
        let reader = BufReader::new(File::open(path)?);
        let mut samples = Vec::new();
        for (index, line) in reader.lines().enumerate() {
            let line = line?;
            if line.trim().is_empty() {
                continue;
            }
            let sample: TelemetryEnvelope =
                serde_json::from_str(&line).map_err(|error| PlaybackError::InvalidLine {
                    line: index + 1,
                    reason: error.to_string(),
                })?;
            if !sample.is_valid() {
                return Err(PlaybackError::InvalidLine {
                    line: index + 1,
                    reason: "sample violates the telemetry contract".to_owned(),
                });
            }
            samples.push(sample);
        }
        if samples.is_empty() {
            return Err(PlaybackError::Empty);
        }
        structured_log(
            "playback_start",
            json!({ "path": path, "samples": samples.len() }),
        );
        Ok(Self {
            samples,
            cursor: 0,
            sequence: 0,
        })
    }
}

impl TelemetryProvider for PlaybackProvider {
    fn next_sample(&mut self) -> TelemetryEnvelope {
        let mut sample = self.samples[self.cursor].clone();
        sample.sequence = self.sequence;
        sample.captured_at = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        sample.source = TelemetrySource::Playback;
        self.cursor = (self.cursor + 1) % self.samples.len();
        self.sequence += 1;
        sample
    }
}

impl Drop for PlaybackProvider {
    fn drop(&mut self) {
        structured_log("playback_finish", json!({ "samplesPlayed": self.sequence }));
    }
}

#[derive(Clone)]
struct GatewayState {
    sender: broadcast::Sender<String>,
    next_client_id: Arc<AtomicU64>,
}

async fn telemetry_upgrade(
    upgrade: WebSocketUpgrade,
    State(state): State<Arc<GatewayState>>,
) -> Response {
    let client_id = state.next_client_id.fetch_add(1, Ordering::Relaxed);
    structured_log("client_connection", json!({ "clientId": client_id }));
    upgrade.on_upgrade(move |socket| stream_to_client(socket, state.sender.subscribe(), client_id))
}

async fn stream_to_client(
    socket: WebSocket,
    mut receiver: broadcast::Receiver<String>,
    client_id: u64,
) {
    let (mut socket_sender, mut socket_receiver) = socket.split();
    loop {
        tokio::select! {
            received = receiver.recv() => {
                match received {
                    Ok(payload) => {
                        if socket_sender.send(Message::Text(payload.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(skipped)) => {
                        structured_log(
                            "client_backpressure",
                            json!({ "clientId": client_id, "skippedSnapshots": skipped }),
                        );
                    }
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
            incoming = socket_receiver.next() => {
                match incoming {
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                    Some(Ok(_)) => structured_log(
                        "malformed_message",
                        json!({ "clientId": client_id, "reason": "unexpected_client_message" }),
                    ),
                }
            }
        }
    }
    structured_log("client_disconnection", json!({ "clientId": client_id }));
}

/// Run the loopback-only desktop gateway until the process is stopped.
///
/// # Errors
///
/// Returns an I/O error when the listener cannot bind or the HTTP server fails.
pub async fn run_gateway(
    address: SocketAddr,
    provider: Box<dyn TelemetryProvider>,
) -> std::io::Result<()> {
    run_gateway_until(address, provider, std::future::pending()).await
}

/// Run the loopback-only gateway until the supplied shutdown signal resolves.
///
/// # Errors
///
/// Returns an I/O error when the listener cannot bind or the HTTP server fails.
pub async fn run_gateway_until<F>(
    address: SocketAddr,
    provider: Box<dyn TelemetryProvider>,
    shutdown: F,
) -> std::io::Result<()>
where
    F: Future<Output = ()> + Send + 'static,
{
    let provider = Arc::new(Mutex::new(provider));
    let (sender, _) = broadcast::channel::<String>(BROADCAST_CAPACITY);
    let (shutdown_sender, shutdown_receiver) = watch::channel(false);
    let state = Arc::new(GatewayState {
        sender: sender.clone(),
        next_client_id: Arc::new(AtomicU64::new(1)),
    });

    let shutdown_notifier = shutdown_sender.clone();
    tokio::spawn(async move {
        shutdown.await;
        let _ = shutdown_notifier.send(true);
    });

    let mut producer_shutdown = shutdown_receiver.clone();
    let producer = tokio::spawn(async move {
        let mut ticker = tokio::time::interval(UPDATE_INTERVAL);
        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    let sample = provider.lock().await.next_sample();
                    if let Ok(payload) = serde_json::to_string(&sample) {
                        let _ = sender.send(payload);
                    }
                }
                result = producer_shutdown.changed() => {
                    if result.is_err() || *producer_shutdown.borrow() {
                        break;
                    }
                }
            }
        }
    });

    let app = Router::new()
        .route("/telemetry", get(telemetry_upgrade))
        .with_state(state);
    let listener = tokio::net::TcpListener::bind(address).await?;
    let local_address = listener.local_addr()?;
    structured_log("startup", json!({ "address": local_address }));

    let mut server_shutdown = shutdown_receiver;
    let server_result = axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            while server_shutdown.changed().await.is_ok() {
                if *server_shutdown.borrow() {
                    break;
                }
            }
        })
        .await;
    let _ = shutdown_sender.send(true);
    let _ = producer.await;
    structured_log("graceful_shutdown", json!({}));
    server_result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simulated_sample_uses_contract_ranges() {
        let sample = SimulatedProvider::at_elapsed(12.0, 42);
        assert!(sample.is_valid());
        assert_eq!(sample.sequence, 42);
        assert_eq!(sample.source, TelemetrySource::Simulation);
    }

    #[test]
    fn rust_wire_keys_match_typescript_contract() {
        let sample = SimulatedProvider::at_elapsed(2.0, 1);
        let json = serde_json::to_value(sample).expect("sample should serialize");
        assert_eq!(json["schemaVersion"], SCHEMA_VERSION);
        assert!(json["telemetry"]["speedKph"].is_number());
        assert!(json["telemetry"]["warnings"]["lowOilPressure"].is_boolean());
    }

    #[test]
    fn contract_manifest_and_canonical_envelope_are_compatible() {
        let manifest: serde_json::Value = serde_json::from_str(include_str!(
            "../../../packages/vehicle-schema/contract/v1.json"
        ))
        .expect("contract manifest should be JSON");
        let canonical: TelemetryEnvelope = serde_json::from_str(include_str!(
            "../../../packages/vehicle-schema/contract/canonical-envelope.json"
        ))
        .expect("canonical envelope should deserialize in Rust");
        let canonical_json = serde_json::to_value(&canonical).expect("canonical should serialize");

        assert_eq!(manifest["schemaVersion"], SCHEMA_VERSION);
        assert!(canonical.is_valid());
        assert_eq!(
            manifest["timestamp"]["pattern"],
            r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$"
        );
        for field_name in manifest["envelopeFields"]
            .as_object()
            .expect("envelope fields")
            .keys()
        {
            assert!(canonical_json.get(field_name).is_some());
        }
        for field in manifest["telemetryFields"]
            .as_object()
            .expect("telemetry fields")
            .values()
        {
            assert_eq!(field["nullable"], false);
            assert!(field["unit"].is_string());
        }
        for warning in manifest["warningFields"]
            .as_object()
            .expect("warning fields")
            .values()
        {
            assert_eq!(warning["type"], "boolean");
            assert_eq!(warning["nullable"], false);
        }

        let expected_units = [
            ("rpm", "rpm"),
            ("speedKph", "km/h"),
            ("gear", "selected gear"),
            ("throttlePercent", "percent"),
            ("coolantTempC", "degrees Celsius"),
            ("oilTempC", "degrees Celsius"),
            ("oilPressureKpa", "kilopascals"),
            ("fuelPercent", "percent"),
            ("batteryVoltage", "volts"),
            ("warnings", "boolean indicators"),
        ];
        for (field, unit) in expected_units {
            assert_eq!(manifest["telemetryFields"][field]["unit"], unit);
        }

        let mut null_sample = canonical_json;
        null_sample["telemetry"]["oilTempC"] = serde_json::Value::Null;
        assert!(serde_json::from_value::<TelemetryEnvelope>(null_sample).is_err());
    }

    #[test]
    fn broadcast_queue_has_a_fixed_capacity() {
        assert_eq!(BROADCAST_CAPACITY, 32);
        let (sender, mut slow_receiver) = broadcast::channel(BROADCAST_CAPACITY);
        let mut healthy_receiver = sender.subscribe();
        for sequence in 0..=BROADCAST_CAPACITY {
            sender.send(sequence).expect("receivers remain active");
            assert_eq!(
                healthy_receiver.try_recv().expect("healthy receiver"),
                sequence
            );
        }
        assert!(matches!(
            slow_receiver.try_recv(),
            Err(broadcast::error::TryRecvError::Lagged(1))
        ));
        assert_eq!(
            healthy_receiver.try_recv(),
            Err(broadcast::error::TryRecvError::Empty)
        );
    }

    #[test]
    fn playback_rejects_invalid_contract_data() {
        let file = tempfile::NamedTempFile::new().expect("temp file");
        std::fs::write(file.path(), "{\"schemaVersion\":999}\n").expect("write fixture");
        assert!(matches!(
            PlaybackProvider::from_path(file.path()),
            Err(PlaybackError::InvalidLine { line: 1, .. })
        ));
    }

    #[test]
    fn playback_loops_and_restamps_samples() {
        let file = tempfile::NamedTempFile::new().expect("temp file");
        let sample = SimulatedProvider::at_elapsed(3.0, 99);
        std::fs::write(
            file.path(),
            format!("{}\n", serde_json::to_string(&sample).expect("serialize")),
        )
        .expect("write fixture");
        let mut provider = PlaybackProvider::from_path(file.path()).expect("valid playback");
        let first = provider.next_sample();
        let second = provider.next_sample();
        assert_eq!(first.sequence, 0);
        assert_eq!(second.sequence, 1);
        assert_eq!(second.source, TelemetrySource::Playback);
    }
}
