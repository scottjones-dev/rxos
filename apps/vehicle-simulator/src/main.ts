import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { WebSocket, WebSocketServer } from "ws";
import { simulatedEnvelope } from "@rxos/telemetry-fixtures";
import {
  isTelemetryEnvelope,
  type TelemetryEnvelope,
} from "@rxos/vehicle-schema";

export const DEFAULT_PORT = 8787;
export const DEFAULT_UPDATE_HZ = 10;
export const MAX_CLIENT_BUFFER_BYTES = 256 * 1024;

export interface SimulatorOptions {
  readonly updateHz?: number;
  readonly log?: (entry: Readonly<Record<string, unknown>>) => void;
}

interface SimulatorRuntime {
  readonly interval: ReturnType<typeof setInterval>;
  readonly log: (entry: Readonly<Record<string, unknown>>) => void;
  readonly playback: boolean;
}

const runtimes = new WeakMap<WebSocketServer, SimulatorRuntime>();

function defaultLog(entry: Readonly<Record<string, unknown>>): void {
  console.log(JSON.stringify({ component: "vehicle-simulator", ...entry }));
}

export function intervalForHz(updateHz: number): number {
  if (!Number.isInteger(updateHz) || updateHz < 1 || updateHz > 60) {
    throw new Error("updateHz must be an integer between 1 and 60");
  }
  return 1_000 / updateHz;
}

export function generateDeterministicLoad(
  updateHz: number,
  durationSeconds: number,
): readonly TelemetryEnvelope[] {
  intervalForHz(updateHz);
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1) {
    throw new Error("durationSeconds must be a positive integer");
  }
  return Array.from({ length: updateHz * durationSeconds }, (_, sequence) =>
    simulatedEnvelope(
      sequence / updateHz,
      sequence,
      new Date(sequence * intervalForHz(updateHz)).toISOString(),
    ),
  );
}

export function clientCanAccept(bufferedAmount: number): boolean {
  return bufferedAmount <= MAX_CLIENT_BUFFER_BYTES;
}

export function parseRecording(content: string): readonly TelemetryEnvelope[] {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const candidate: unknown = JSON.parse(line);
      if (!isTelemetryEnvelope(candidate)) {
        throw new Error(`Invalid recording at line ${index + 1}`);
      }
      return candidate;
    });
}

async function loadPlayback(
  path: string,
): Promise<readonly TelemetryEnvelope[]> {
  const content = await readFile(path, "utf8");
  const samples = parseRecording(content);
  if (samples.length === 0) throw new Error("Recording contains no samples");
  return samples;
}

export async function startSimulator(
  port = DEFAULT_PORT,
  recordingPath?: string,
  options: SimulatorOptions = {},
): Promise<WebSocketServer> {
  const log = options.log ?? defaultLog;
  const updateHz = options.updateHz ?? DEFAULT_UPDATE_HZ;
  const recording = recordingPath
    ? await loadPlayback(recordingPath)
    : undefined;
  if (recording) {
    log({
      event: "playback_start",
      path: recordingPath,
      samples: recording.length,
    });
  }
  const startedAt = Date.now();
  let sequence = 0;
  const server = new WebSocketServer({ port, path: "/telemetry" });

  server.on("connection", (client, request) => {
    log({
      event: "client_connection",
      remoteAddress: request.socket.remoteAddress ?? "unknown",
    });
    client.on("message", () => {
      log({ event: "malformed_message", reason: "unexpected_client_message" });
    });
    client.on("close", () => {
      log({ event: "client_disconnection" });
    });
    client.on("error", (error) => {
      log({
        event: "client_disconnection",
        reason: "socket_error",
        message: error.message,
      });
    });
  });
  server.once("listening", () => {
    const address = server.address();
    const boundPort =
      typeof address === "object" && address ? address.port : port;
    log({ event: "startup", port: boundPort, updateHz });
  });

  const interval = setInterval(() => {
    const capturedAt = new Date().toISOString();
    const sourceSample = recording?.[sequence % recording.length];
    const envelope: TelemetryEnvelope = sourceSample
      ? {
          ...sourceSample,
          source: "playback",
          sequence,
          capturedAt,
        }
      : simulatedEnvelope(
          (Date.now() - startedAt) / 1_000,
          sequence,
          capturedAt,
        );
    const message = JSON.stringify(envelope);
    for (const client of server.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      if (!clientCanAccept(client.bufferedAmount)) {
        log({
          event: "client_disconnection",
          reason: "backpressure_limit",
          bufferedBytes: client.bufferedAmount,
        });
        client.terminate();
        continue;
      }
      client.send(message);
    }
    sequence += 1;
  }, intervalForHz(updateHz));

  server.on("close", () => clearInterval(interval));
  runtimes.set(server, { interval, log, playback: recording !== undefined });
  return server;
}

export async function stopSimulator(server: WebSocketServer): Promise<void> {
  const runtime = runtimes.get(server);
  if (runtime) clearInterval(runtime.interval);
  for (const client of server.clients) {
    client.close(1001, "RXOS simulator shutting down");
  }
  await new Promise<void>((resolve) => {
    const forceClose = setTimeout(() => {
      for (const client of server.clients) client.terminate();
    }, 1_000);
    server.close(() => {
      clearTimeout(forceClose);
      resolve();
    });
  });
  if (runtime?.playback) runtime.log({ event: "playback_finish" });
  runtime?.log({ event: "graceful_shutdown" });
  runtimes.delete(server);
}

function parseArguments(argv: readonly string[]): {
  port: number;
  recordingPath?: string;
  updateHz: number;
} {
  const playbackIndex = argv.indexOf("--playback");
  const portIndex = argv.indexOf("--port");
  const updateHzIndex = argv.indexOf("--hz");
  const recordingPath =
    playbackIndex >= 0 ? argv[playbackIndex + 1] : undefined;
  const rawPort = portIndex >= 0 ? argv[portIndex + 1] : undefined;
  const port = rawPort === undefined ? DEFAULT_PORT : Number(rawPort);
  const updateHz =
    updateHzIndex >= 0 ? Number(argv[updateHzIndex + 1]) : DEFAULT_UPDATE_HZ;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("--port must be between 1 and 65535");
  }
  intervalForHz(updateHz);
  return { port, recordingPath, updateHz };
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  const options = parseArguments(process.argv.slice(2));
  const server = await startSimulator(options.port, options.recordingPath, {
    updateHz: options.updateHz,
  });
  const mode = options.recordingPath
    ? `playback: ${options.recordingPath}`
    : "deterministic simulation";
  console.log(
    `RXOS simulator (${mode}) listening on ws://127.0.0.1:${options.port}/telemetry`,
  );

  const stop = async (): Promise<void> => {
    await stopSimulator(server);
    process.exitCode = 0;
  };
  process.once("SIGINT", () => void stop());
  process.once("SIGTERM", () => void stop());
}
