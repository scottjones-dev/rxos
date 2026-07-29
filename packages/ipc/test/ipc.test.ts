import { describe, expect, it } from "vitest";
import {
  parseTelemetryMessage,
  telemetryStatus,
  type StreamStatus,
} from "../src/index.js";
import {
  TELEMETRY_SCHEMA_VERSION,
  type TelemetryEnvelope,
} from "@rxos/vehicle-schema";

const envelope: TelemetryEnvelope = {
  schemaVersion: TELEMETRY_SCHEMA_VERSION,
  sequence: 0,
  capturedAt: "2026-07-29T10:00:00.000Z",
  source: "simulation",
  telemetry: {
    rpm: 0,
    speedKph: 0,
    gear: "N",
    throttlePercent: 0,
    coolantTempC: 20,
    oilTempC: 20,
    oilPressureKpa: 0,
    fuelPercent: 75,
    batteryVoltage: 12.6,
    warnings: {
      checkEngine: false,
      coolantTemperature: false,
      lowFuel: false,
      lowOilPressure: false,
    },
  },
};

describe("IPC helpers", () => {
  it("parses a valid message", () => {
    expect(parseTelemetryMessage(JSON.stringify(envelope))).toEqual(envelope);
  });

  it("rejects an invalid message", () => {
    expect(() => parseTelemetryMessage('{"schemaVersion": 999}')).toThrow(
      "Invalid telemetry envelope",
    );
  });

  it.each<[boolean, TelemetryEnvelope | undefined, number, StreamStatus]>([
    [false, envelope, Date.parse(envelope.capturedAt), "lost"],
    [true, undefined, Date.parse(envelope.capturedAt), "connecting"],
    [true, envelope, Date.parse(envelope.capturedAt) + 1_000, "live"],
    [true, envelope, Date.parse(envelope.capturedAt) + 2_000, "stale"],
  ])(
    "derives transport and freshness state",
    (connected, sample, now, status) => {
      expect(telemetryStatus(sample, connected, now)).toBe(status);
    },
  );
});
