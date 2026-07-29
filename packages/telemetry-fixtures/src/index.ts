import {
  TELEMETRY_SCHEMA_VERSION,
  type Gear,
  type TelemetryEnvelope,
} from "@rxos/vehicle-schema";

const gears: readonly Gear[] = ["N", "1", "2", "3", "4", "5", "6"];

export function simulatedEnvelope(
  elapsedSeconds: number,
  sequence: number,
  capturedAt = new Date().toISOString(),
): TelemetryEnvelope {
  const cycle = elapsedSeconds % 30;
  const throttle = Math.max(0, Math.sin(cycle / 4) * 72);
  const speed = Math.max(0, Math.sin(cycle / 19) * 165);
  const gearIndex = Math.min(6, Math.max(0, Math.floor(speed / 28)));
  const gear = gears[gearIndex] ?? "N";
  const rpm =
    gear === "N"
      ? 900 + throttle * 45
      : 1_300 + (speed % 28) * 230 + throttle * 16;
  const oilPressure = Math.max(80, 110 + rpm * 0.065);
  const coolant = Math.min(96, 20 + elapsedSeconds * 1.8);
  const oil = Math.min(108, 20 + elapsedSeconds * 1.55);
  const fuel = Math.max(4, 78 - elapsedSeconds / 1_200);

  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    sequence,
    capturedAt,
    source: "simulation",
    telemetry: {
      rpm: Math.round(Math.min(9_000, rpm)),
      speedKph: Math.round(speed * 10) / 10,
      gear,
      throttlePercent: Math.round(throttle * 10) / 10,
      coolantTempC: Math.round(coolant * 10) / 10,
      oilTempC: Math.round(oil * 10) / 10,
      oilPressureKpa: Math.round(oilPressure),
      fuelPercent: Math.round(fuel * 10) / 10,
      batteryVoltage: 13.8 + Math.sin(elapsedSeconds) * 0.15,
      warnings: {
        checkEngine: false,
        coolantTemperature: coolant >= 115,
        lowFuel: fuel <= 10,
        lowOilPressure: oilPressure < 100 && rpm > 1_500,
      },
    },
  };
}
