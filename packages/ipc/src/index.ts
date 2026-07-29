import {
  isTelemetryEnvelope,
  type TelemetryEnvelope,
} from "@rxos/vehicle-schema";

export const DEFAULT_TELEMETRY_URL = "ws://127.0.0.1:8787/telemetry";
export const STALE_AFTER_MS = 1_500;

export type StreamStatus = "connecting" | "live" | "stale" | "lost";

export function parseTelemetryMessage(message: string): TelemetryEnvelope {
  const candidate: unknown = JSON.parse(message);
  if (!isTelemetryEnvelope(candidate)) {
    throw new Error("Invalid telemetry envelope");
  }
  return candidate;
}

export function telemetryStatus(
  envelope: TelemetryEnvelope | undefined,
  connected: boolean,
  nowMs = Date.now(),
): StreamStatus {
  if (!connected) return "lost";
  if (!envelope) return "connecting";
  return nowMs - Date.parse(envelope.capturedAt) > STALE_AFTER_MS
    ? "stale"
    : "live";
}
