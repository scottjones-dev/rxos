import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { simulatedEnvelope } from "@rxos/telemetry-fixtures";
import type {
  TelemetryEnvelope,
  WarningIndicators,
} from "@rxos/vehicle-schema";

const PORT = 8787;
const STEP_MS = 900;

function log(event: string, context: Readonly<Record<string, unknown>> = {}) {
  console.log(
    JSON.stringify({ component: "rxos-demo-scenario", event, ...context }),
  );
}

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function connected(server: WebSocketServer): Promise<WebSocket> {
  return new Promise((resolve) => server.once("connection", resolve));
}

function withWarnings(
  envelope: TelemetryEnvelope,
  warnings: Partial<WarningIndicators>,
): TelemetryEnvelope {
  return {
    ...envelope,
    telemetry: {
      ...envelope.telemetry,
      warnings: { ...envelope.telemetry.warnings, ...warnings },
    },
  };
}

async function send(
  client: WebSocket,
  name: string,
  envelope: TelemetryEnvelope,
): Promise<void> {
  log("scenario_step", { name, sequence: envelope.sequence });
  client.send(JSON.stringify(envelope));
  await wait(STEP_MS);
}

async function main(): Promise<void> {
  const server = new WebSocketServer({ port: PORT, path: "/telemetry" });
  await new Promise<void>((resolve) => server.once("listening", resolve));
  log("scenario_start", {
    endpoint: `ws://127.0.0.1:${PORT}/telemetry`,
    displayHint: "Launch driver display with --demo-cycle to cycle modes",
  });
  const client = await connected(server);
  let sequence = 0;

  await send(client, "normal_daily_driving", simulatedEnvelope(8, sequence++));
  log("display_mode", { mode: "Daily" });
  await send(client, "high_rpm_acceleration", {
    ...simulatedEnvelope(12, sequence++),
    telemetry: {
      ...simulatedEnvelope(12, sequence).telemetry,
      rpm: 8_700,
      throttlePercent: 92,
    },
  });
  log("display_mode", { mode: "Performance" });
  await send(
    client,
    "advisory",
    withWarnings(simulatedEnvelope(14, sequence++), { checkEngine: true }),
  );
  await send(
    client,
    "caution",
    withWarnings(simulatedEnvelope(16, sequence++), {
      coolantTemperature: true,
    }),
  );
  log("display_mode", { mode: "Track", lapData: "unavailable" });
  await send(
    client,
    "critical_simulated_warning",
    withWarnings(simulatedEnvelope(18, sequence++), {
      lowOilPressure: true,
    }),
  );
  await send(
    client,
    "telemetry_stale",
    simulatedEnvelope(
      20,
      sequence++,
      new Date(Date.now() - 5_000).toISOString(),
    ),
  );
  log("connection_loss");
  client.close(1012, "deterministic demo reconnect");
  await wait(STEP_MS);
  const reconnected = await connected(server);
  await send(
    reconnected,
    "reconnection_recovery",
    simulatedEnvelope(22, sequence++),
  );
  reconnected.close(1000, "demo complete");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  log("scenario_finish");
}

await main();
