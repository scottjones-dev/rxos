export const TELEMETRY_SCHEMA_VERSION = 1 as const;
export const TELEMETRY_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

export const gears = ["R", "N", "1", "2", "3", "4", "5", "6"] as const;
export type Gear = (typeof gears)[number];

export type TelemetrySource = "simulation" | "playback";

export interface WarningIndicators {
  readonly checkEngine: boolean;
  readonly coolantTemperature: boolean;
  readonly lowFuel: boolean;
  readonly lowOilPressure: boolean;
}

export interface VehicleTelemetry {
  readonly rpm: number;
  readonly speedKph: number;
  readonly gear: Gear;
  readonly throttlePercent: number;
  readonly coolantTempC: number;
  readonly oilTempC: number;
  readonly oilPressureKpa: number;
  readonly fuelPercent: number;
  readonly batteryVoltage: number;
  readonly warnings: WarningIndicators;
}

export interface TelemetryEnvelope {
  readonly schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  readonly sequence: number;
  readonly capturedAt: string;
  readonly source: TelemetrySource;
  readonly telemetry: VehicleTelemetry;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const finiteInRange = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= minimum &&
  value <= maximum;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateTelemetryEnvelope(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["envelope must be an object"] };
  }

  if (value.schemaVersion !== TELEMETRY_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${TELEMETRY_SCHEMA_VERSION}`);
  }
  if (!Number.isSafeInteger(value.sequence) || (value.sequence as number) < 0) {
    errors.push("sequence must be a non-negative safe integer");
  }
  if (
    typeof value.capturedAt !== "string" ||
    !TELEMETRY_TIMESTAMP_PATTERN.test(value.capturedAt) ||
    !Number.isFinite(Date.parse(value.capturedAt))
  ) {
    errors.push(
      "capturedAt must be an RFC 3339 UTC timestamp with milliseconds",
    );
  }
  if (value.source !== "simulation" && value.source !== "playback") {
    errors.push("source must be simulation or playback");
  }
  if (!isRecord(value.telemetry)) {
    errors.push("telemetry must be an object");
    return { valid: false, errors };
  }

  const telemetry = value.telemetry;
  const ranges: ReadonlyArray<
    readonly [keyof VehicleTelemetry, number, number]
  > = [
    ["rpm", 0, 12_000],
    ["speedKph", 0, 350],
    ["throttlePercent", 0, 100],
    ["coolantTempC", -50, 180],
    ["oilTempC", -50, 200],
    ["oilPressureKpa", 0, 1_500],
    ["fuelPercent", 0, 100],
    ["batteryVoltage", 0, 20],
  ];
  for (const [key, minimum, maximum] of ranges) {
    if (!finiteInRange(telemetry[key], minimum, maximum)) {
      errors.push(`${key} must be between ${minimum} and ${maximum}`);
    }
  }
  if (
    typeof telemetry.gear !== "string" ||
    !gears.includes(telemetry.gear as Gear)
  ) {
    errors.push("gear is invalid");
  }

  if (!isRecord(telemetry.warnings)) {
    errors.push("warnings must be an object");
  } else {
    for (const key of [
      "checkEngine",
      "coolantTemperature",
      "lowFuel",
      "lowOilPressure",
    ] as const) {
      if (typeof telemetry.warnings[key] !== "boolean") {
        errors.push(`warnings.${key} must be boolean`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isTelemetryEnvelope(
  value: unknown,
): value is TelemetryEnvelope {
  return validateTelemetryEnvelope(value).valid;
}
