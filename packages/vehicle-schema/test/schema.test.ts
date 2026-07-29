import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  isTelemetryEnvelope,
  TELEMETRY_SCHEMA_VERSION,
  validateTelemetryEnvelope,
  type TelemetryEnvelope,
} from "../src/index.js";

const contract = JSON.parse(
  readFileSync(new URL("../contract/v1.json", import.meta.url), "utf8"),
) as {
  schemaVersion: number;
  timestamp: { pattern: string; nullable: boolean };
  envelopeFields: Record<string, { nullable: boolean }>;
  telemetryFields: Record<string, { unit: string; nullable: boolean }>;
  warningFields: Record<string, { type: string; nullable: boolean }>;
};
const canonical: unknown = JSON.parse(
  readFileSync(
    new URL("../contract/canonical-envelope.json", import.meta.url),
    "utf8",
  ),
);

const validEnvelope: TelemetryEnvelope = {
  schemaVersion: TELEMETRY_SCHEMA_VERSION,
  sequence: 4,
  capturedAt: "2026-07-29T12:00:00.000Z",
  source: "simulation",
  telemetry: {
    rpm: 4200,
    speedKph: 96,
    gear: "4",
    throttlePercent: 42,
    coolantTempC: 88,
    oilTempC: 96,
    oilPressureKpa: 350,
    fuelPercent: 65,
    batteryVoltage: 13.9,
    warnings: {
      checkEngine: false,
      coolantTemperature: false,
      lowFuel: false,
      lowOilPressure: false,
    },
  },
};

describe("telemetry contract", () => {
  it("accepts a complete valid envelope", () => {
    expect(isTelemetryEnvelope(validEnvelope)).toBe(true);
  });

  it("rejects out-of-range and incomplete data", () => {
    const result = validateTelemetryEnvelope({
      ...validEnvelope,
      telemetry: { ...validEnvelope.telemetry, rpm: 99_000, warnings: {} },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("rpm must be between 0 and 12000");
    expect(result.errors).toContain("warnings.lowFuel must be boolean");
  });

  it("implements the complete version-one compatibility manifest", () => {
    expect(contract.schemaVersion).toBe(TELEMETRY_SCHEMA_VERSION);
    expect(isTelemetryEnvelope(canonical)).toBe(true);
    expect(
      new RegExp(contract.timestamp.pattern, "u").test(
        validEnvelope.capturedAt,
      ),
    ).toBe(true);
    expect(contract.timestamp.nullable).toBe(false);
    expect(Object.keys(contract.envelopeFields)).toEqual([
      "schemaVersion",
      "sequence",
      "capturedAt",
      "source",
      "telemetry",
    ]);
    expect(Object.keys(contract.telemetryFields)).toEqual([
      "rpm",
      "speedKph",
      "gear",
      "throttlePercent",
      "coolantTempC",
      "oilTempC",
      "oilPressureKpa",
      "fuelPercent",
      "batteryVoltage",
      "warnings",
    ]);
    expect(
      Object.values(contract.telemetryFields).every(
        (field) => field.nullable === false && field.unit.length > 0,
      ),
    ).toBe(true);
    expect(Object.keys(contract.warningFields)).toEqual([
      "checkEngine",
      "coolantTemperature",
      "lowFuel",
      "lowOilPressure",
    ]);
    expect(
      Object.values(contract.warningFields).every(
        (field) => field.type === "boolean" && field.nullable === false,
      ),
    ).toBe(true);
  });

  it("rejects non-canonical timestamps and nullable fields", () => {
    expect(
      isTelemetryEnvelope({
        ...validEnvelope,
        capturedAt: "2026-07-29T12:00:00Z",
      }),
    ).toBe(false);
    expect(
      isTelemetryEnvelope({
        ...validEnvelope,
        telemetry: { ...validEnvelope.telemetry, oilTempC: null },
      }),
    ).toBe(false);
  });
});
