import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { resolve } from "node:path";
import {
  clientCanAccept,
  generateDeterministicLoad,
  MAX_CLIENT_BUFFER_BYTES,
  parseRecording,
  startSimulator,
  stopSimulator,
} from "../src/main.js";
import {
  isTelemetryEnvelope,
  type TelemetryEnvelope,
} from "@rxos/vehicle-schema";

let server: Awaited<ReturnType<typeof startSimulator>> | undefined;

afterEach(async () => {
  if (server) {
    await stopSimulator(server);
    server = undefined;
  }
});

describe("vehicle simulator", () => {
  it("rejects invalid recordings", () => {
    expect(() => parseRecording('{"schemaVersion":999}')).toThrow(
      "Invalid recording at line 1",
    );
  });

  it("broadcasts typed telemetry on the expected endpoint", async () => {
    server = await startSimulator(0);
    await new Promise<void>((resolve) => server?.once("listening", resolve));
    const address = server.address();
    if (typeof address === "string" || address === null) {
      throw new Error("Expected TCP address");
    }

    const sample = await new Promise<unknown>((resolve, reject) => {
      const client = new WebSocket(`ws://127.0.0.1:${address.port}/telemetry`);
      client.once("message", (data) => {
        resolve(JSON.parse(data.toString()));
        client.close();
      });
      client.once("error", reject);
    });
    expect(isTelemetryEnvelope(sample)).toBe(true);
  });

  it("replays a recording through the same live endpoint", async () => {
    const recording = resolve(
      "../../packages/telemetry-fixtures/recordings/demo-lap.ndjson",
    );
    server = await startSimulator(0, recording);
    await new Promise<void>((resolveListening) =>
      server?.once("listening", resolveListening),
    );
    const address = server.address();
    if (typeof address === "string" || address === null) {
      throw new Error("Expected TCP address");
    }

    const sample = await new Promise<TelemetryEnvelope>(
      (resolveSample, reject) => {
        const client = new WebSocket(
          `ws://127.0.0.1:${address.port}/telemetry`,
        );
        client.once("message", (data) => {
          const candidate: unknown = JSON.parse(data.toString());
          if (isTelemetryEnvelope(candidate)) resolveSample(candidate);
          else reject(new Error("Playback emitted invalid telemetry"));
          client.close();
        });
        client.once("error", reject);
      },
    );
    expect(sample.source).toBe("playback");
    expect(sample.telemetry.rpm).toBe(950);
  });

  it.each([1, 10, 20, 60])(
    "generates deterministic bounded load at %d Hz",
    (updateHz) => {
      const samples = generateDeterministicLoad(updateHz, 60);
      expect(samples).toHaveLength(updateHz * 60);
      expect(samples.at(0)?.sequence).toBe(0);
      expect(samples.at(-1)?.sequence).toBe(updateHz * 60 - 1);
      expect(samples.every(isTelemetryEnvelope)).toBe(true);
    },
  );

  it("enforces a finite per-client backpressure limit", () => {
    expect(clientCanAccept(MAX_CLIENT_BUFFER_BYTES)).toBe(true);
    expect(clientCanAccept(MAX_CLIENT_BUFFER_BYTES + 1)).toBe(false);
  });

  it("continues serving a healthy client after another disconnects", async () => {
    server = await startSimulator(0, undefined, {
      updateHz: 60,
      log: () => {},
    });
    await new Promise<void>((resolveListening) =>
      server?.once("listening", resolveListening),
    );
    const address = server.address();
    if (typeof address === "string" || address === null) {
      throw new Error("Expected TCP address");
    }
    const url = `ws://127.0.0.1:${address.port}/telemetry`;
    const disconnectedClient = new WebSocket(url);
    const healthyClient = new WebSocket(url);
    await Promise.all([
      new Promise<void>((resolveOpen, reject) => {
        disconnectedClient.once("open", resolveOpen);
        disconnectedClient.once("error", reject);
      }),
      new Promise<void>((resolveOpen, reject) => {
        healthyClient.once("open", resolveOpen);
        healthyClient.once("error", reject);
      }),
    ]);
    disconnectedClient.terminate();

    const sequences = await new Promise<number[]>((resolveSamples, reject) => {
      const received: number[] = [];
      healthyClient.on("message", (data) => {
        const candidate: unknown = JSON.parse(data.toString());
        if (!isTelemetryEnvelope(candidate)) {
          reject(new Error("Healthy client received invalid telemetry"));
          return;
        }
        received.push(candidate.sequence);
        if (received.length === 5) resolveSamples(received);
      });
      healthyClient.once("error", reject);
    });
    healthyClient.close();
    expect(sequences).toHaveLength(5);
    expect(sequences).toEqual(
      [...sequences].sort((left, right) => left - right),
    );
  });
});
