use std::{env, net::SocketAddr, path::Path};

use rxos_vehicle_gateway::{
    run_gateway_until, PlaybackProvider, SimulatedProvider, TelemetryProvider,
};

fn provider_from_args(
    arguments: &[String],
) -> Result<Box<dyn TelemetryProvider>, Box<dyn std::error::Error>> {
    if let Some(index) = arguments
        .iter()
        .position(|argument| argument == "--playback")
    {
        let path = arguments
            .get(index + 1)
            .ok_or("--playback requires a recording path")?;
        return Ok(Box::new(PlaybackProvider::from_path(Path::new(path))?));
    }
    Ok(Box::<SimulatedProvider>::default())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let arguments = env::args().skip(1).collect::<Vec<_>>();
    let provider = provider_from_args(&arguments)?;
    let address = SocketAddr::from(([127, 0, 0, 1], 8787));
    run_gateway_until(address, provider, shutdown_signal()).await?;
    Ok(())
}

async fn shutdown_signal() {
    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};

        let mut terminate =
            signal(SignalKind::terminate()).expect("SIGTERM handler should install");
        tokio::select! {
            result = tokio::signal::ctrl_c() => {
                result.expect("Ctrl-C handler should remain active");
            }
            _ = terminate.recv() => {}
        }
    }

    #[cfg(not(unix))]
    tokio::signal::ctrl_c()
        .await
        .expect("Ctrl-C handler should remain active");
}
