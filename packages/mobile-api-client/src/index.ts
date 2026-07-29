import {
  isTelemetryEnvelope,
  type TelemetryEnvelope,
  type VehicleTelemetry,
} from "@rxos/vehicle-schema";

export type ConnectionPhase =
  "connecting" | "live" | "stale" | "reconnecting" | "disconnected" | "invalid";

export interface ConnectionState {
  readonly phase: ConnectionPhase;
  readonly lastValidAt?: number;
  readonly invalidReason?: string;
  readonly retryAttempt: number;
}

export const initialConnectionState: ConnectionState = {
  phase: "disconnected",
  retryAttempt: 0,
};

export type ConnectionEvent =
  | { readonly type: "connect" }
  | { readonly type: "valid"; readonly receivedAt: number }
  | { readonly type: "invalid"; readonly reason: string }
  | { readonly type: "stale"; readonly now: number }
  | { readonly type: "close"; readonly willRetry: boolean }
  | { readonly type: "retry"; readonly attempt: number };

export function reduceConnection(
  state: ConnectionState,
  event: ConnectionEvent,
): ConnectionState {
  switch (event.type) {
    case "connect":
      return { ...state, phase: "connecting", invalidReason: undefined };
    case "valid":
      return {
        phase: "live",
        lastValidAt: event.receivedAt,
        retryAttempt: 0,
      };
    case "invalid":
      return { ...state, phase: "invalid", invalidReason: event.reason };
    case "stale":
      return state.lastValidAt === undefined
        ? state
        : { ...state, phase: "stale" };
    case "close":
      return {
        ...state,
        phase: event.willRetry ? "reconnecting" : "disconnected",
      };
    case "retry":
      return { ...state, phase: "reconnecting", retryAttempt: event.attempt };
  }
}

export const STALE_AFTER_MS = 1_500;
export const MAX_RETRY_MS = 30_000;

export function retryDelay(attempt: number): number {
  return Math.min(MAX_RETRY_MS, 500 * 2 ** Math.max(0, attempt));
}

export function deriveFreshness(
  lastValidAt: number | undefined,
  now: number,
): "live" | "stale" | "lost" {
  if (lastValidAt === undefined) return "lost";
  return now - lastValidAt <= STALE_AFTER_MS ? "live" : "stale";
}

export function parseTelemetryMessage(raw: string): {
  readonly envelope?: TelemetryEnvelope;
  readonly error?: string;
} {
  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    return { error: "Telemetry message is not valid JSON" };
  }
  if (!isTelemetryEnvelope(candidate)) {
    return { error: "Telemetry message does not match schema version 1" };
  }
  return { envelope: candidate };
}

export interface PairingPayload {
  readonly host: string;
  readonly port: number;
  readonly protocolVersion: 1;
  readonly simulatorName: string;
}

const LOCAL_HOST =
  /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/u;

export function parsePairingPayload(raw: string): PairingPayload | undefined {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return undefined;
    const record = value as Record<string, unknown>;
    const allowedKeys = new Set([
      "host",
      "port",
      "protocolVersion",
      "simulatorName",
    ]);
    if (
      Object.keys(record).some((key) => !allowedKeys.has(key)) ||
      typeof record.host !== "string" ||
      !LOCAL_HOST.test(record.host) ||
      !Number.isInteger(record.port) ||
      (record.port as number) < 1 ||
      (record.port as number) > 65_535 ||
      record.protocolVersion !== 1 ||
      typeof record.simulatorName !== "string" ||
      record.simulatorName.length < 1 ||
      record.simulatorName.length > 80
    )
      return undefined;
    return {
      host: record.host,
      port: record.port as number,
      protocolVersion: 1,
      simulatorName: record.simulatorName,
    };
  } catch {
    return undefined;
  }
}

export type UnitPreference = "uk" | "metric";
export type DashboardMode = "road" | "sport" | "track";

export interface MobileSettings {
  readonly units: UnitPreference;
  readonly locale: "en-GB";
  readonly theme: "dark" | "system";
  readonly accent: "blue" | "violet" | "green";
  readonly dashboardMode: DashboardMode;
  readonly reducedMotion: boolean;
  readonly notificationsEnabled: boolean;
  readonly diagnosticLogging: boolean;
  readonly simulatorHost: string;
  readonly simulatorPort: number;
}

export const defaultSettings: MobileSettings = {
  units: "uk",
  locale: "en-GB",
  theme: "dark",
  accent: "blue",
  dashboardMode: "road",
  reducedMotion: false,
  notificationsEnabled: false,
  diagnosticLogging: true,
  simulatorHost: "127.0.0.1",
  simulatorPort: 8787,
};

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function settingsRepository(storage: KeyValueStorage) {
  const key = "rxos.mobile.settings.v1";
  return {
    async load(): Promise<MobileSettings> {
      const raw = await storage.getItem(key);
      if (!raw) return defaultSettings;
      try {
        const candidate = JSON.parse(raw) as Partial<MobileSettings>;
        return { ...defaultSettings, ...candidate };
      } catch {
        return defaultSettings;
      }
    },
    async save(settings: MobileSettings): Promise<void> {
      await storage.setItem(key, JSON.stringify(settings));
    },
  };
}

export interface Trip {
  readonly id: string;
  readonly startedAt: string;
  readonly distanceKm: number;
  readonly durationMinutes: number;
  readonly averageSpeedKph: number;
  readonly fuelUsedLitres?: number;
  readonly startLabel: string;
  readonly destinationLabel: string;
}

export const tripFixtures: readonly Trip[] = [
  {
    id: "trip-2026-07-29",
    startedAt: "2026-07-29T17:14:00.000Z",
    distanceKm: 29.6,
    durationMinutes: 31,
    averageSpeedKph: 57.3,
    fuelUsedLitres: 3.1,
    startLabel: "Home",
    destinationLabel: "North London",
  },
  {
    id: "trip-2026-07-27",
    startedAt: "2026-07-27T08:05:00.000Z",
    distanceKm: 12.8,
    durationMinutes: 24,
    averageSpeedKph: 32,
    fuelUsedLitres: 1.7,
    startLabel: "Home",
    destinationLabel: "Workshop",
  },
] as const;

export interface VehicleFixture {
  readonly id: string;
  readonly name: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly connectionMethod: "RXOS Simulator";
}

export const vehicleFixtures: readonly VehicleFixture[] = [
  {
    id: "rx8-simulator",
    name: "Your RX-8",
    make: "Mazda",
    model: "RX-8",
    year: 2008,
    connectionMethod: "RXOS Simulator",
  },
] as const;

export type FixtureScenario =
  | "parked-healthy"
  | "normal-driving"
  | "motorway-driving"
  | "high-rpm"
  | "low-fuel"
  | "battery-warning"
  | "high-coolant"
  | "stale"
  | "disconnected"
  | "invalid";

const baseTelemetry: VehicleTelemetry = {
  rpm: 0,
  speedKph: 0,
  gear: "N",
  throttlePercent: 0,
  coolantTempC: 84,
  oilTempC: 88,
  oilPressureKpa: 180,
  fuelPercent: 63,
  batteryVoltage: 12.7,
  warnings: {
    checkEngine: false,
    coolantTemperature: false,
    lowFuel: false,
    lowOilPressure: false,
  },
};

export function fixtureEnvelope(
  scenario: FixtureScenario,
  now = "2026-07-29T18:00:00.000Z",
): TelemetryEnvelope {
  let telemetry = baseTelemetry;
  if (scenario === "normal-driving")
    telemetry = {
      ...telemetry,
      rpm: 3_250,
      speedKph: 72,
      gear: "4",
      throttlePercent: 24,
    };
  if (scenario === "motorway-driving")
    telemetry = {
      ...telemetry,
      rpm: 4_100,
      speedKph: 112,
      gear: "6",
      throttlePercent: 31,
    };
  if (scenario === "high-rpm")
    telemetry = {
      ...telemetry,
      rpm: 8_200,
      speedKph: 94,
      gear: "3",
      throttlePercent: 82,
    };
  if (scenario === "low-fuel")
    telemetry = {
      ...telemetry,
      fuelPercent: 8,
      warnings: { ...telemetry.warnings, lowFuel: true },
    };
  if (scenario === "battery-warning")
    telemetry = { ...telemetry, batteryVoltage: 11.4 };
  if (scenario === "high-coolant")
    telemetry = {
      ...telemetry,
      coolantTempC: 121,
      warnings: { ...telemetry.warnings, coolantTemperature: true },
    };
  return {
    schemaVersion: 1,
    sequence: 1,
    capturedAt: now,
    source: "simulation",
    telemetry,
  };
}

export function formatDistance(km: number, units: UnitPreference): string {
  const value = units === "uk" ? km * 0.621371 : km;
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value)} ${units === "uk" ? "miles" : "km"}`;
}

export function formatSpeed(kph: number, units: UnitPreference): string {
  const value = units === "uk" ? kph * 0.621371 : kph;
  return `${Math.round(value)} ${units === "uk" ? "mph" : "km/h"}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export interface TelemetrySocketOptions {
  readonly url: string;
  readonly onEnvelope: (
    envelope: TelemetryEnvelope,
    receivedAt: number,
  ) => void;
  readonly onState: (state: ConnectionState) => void;
  readonly log?: (entry: Readonly<Record<string, unknown>>) => void;
  readonly createSocket?: (url: string) => WebSocket;
  readonly now?: () => number;
}

export class TelemetrySocket {
  private socket?: WebSocket;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private staleTimer?: ReturnType<typeof setInterval>;
  private active = false;
  private attempt = 0;
  private state = initialConnectionState;
  private readonly now: () => number;

  public constructor(private readonly options: TelemetrySocketOptions) {
    this.now = options.now ?? Date.now;
  }

  public start(): void {
    if (this.active) return;
    this.active = true;
    this.connect();
    this.staleTimer = setInterval(() => {
      if (deriveFreshness(this.state.lastValidAt, this.now()) === "stale") {
        this.transition({ type: "stale", now: this.now() });
      }
    }, 500);
  }

  public stop(): void {
    this.active = false;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.staleTimer) clearInterval(this.staleTimer);
    this.socket?.close(1000, "RXOS Companion backgrounded");
    this.socket = undefined;
    this.transition({ type: "close", willRetry: false });
  }

  private transition(event: ConnectionEvent): void {
    this.state = reduceConnection(this.state, event);
    this.options.onState(this.state);
  }

  private connect(): void {
    this.transition({ type: "connect" });
    const socket = this.options.createSocket
      ? this.options.createSocket(this.options.url)
      : new WebSocket(this.options.url);
    this.socket = socket;
    socket.onopen = () =>
      this.options.log?.({
        event: "telemetry_connected",
        url: this.options.url,
      });
    socket.onmessage = (event) => {
      if (typeof event.data !== "string") {
        this.transition({
          type: "invalid",
          reason: "Non-text telemetry message",
        });
        return;
      }
      const parsed = parseTelemetryMessage(event.data);
      if (!parsed.envelope) {
        this.transition({
          type: "invalid",
          reason: parsed.error ?? "Invalid telemetry",
        });
        return;
      }
      const receivedAt = this.now();
      this.attempt = 0;
      this.transition({ type: "valid", receivedAt });
      this.options.onEnvelope(parsed.envelope, receivedAt);
    };
    socket.onerror = () =>
      this.options.log?.({ event: "telemetry_socket_error" });
    socket.onclose = () => {
      if (!this.active) return;
      this.transition({ type: "close", willRetry: true });
      const attempt = this.attempt++;
      this.transition({ type: "retry", attempt });
      this.retryTimer = setTimeout(() => this.connect(), retryDelay(attempt));
    };
  }
}
