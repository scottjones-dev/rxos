import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultSettings,
  fixtureEnvelope,
  initialConnectionState,
  settingsRepository,
  TelemetrySocket,
  type ConnectionState,
  type FixtureScenario,
  type MobileSettings,
} from "@rxos/mobile-api-client";
import type { TelemetryEnvelope } from "@rxos/vehicle-schema";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

interface SettingsValue {
  settings: MobileSettings;
  loaded: boolean;
  update: (next: Partial<MobileSettings>) => void;
}

const SettingsContext = createContext<SettingsValue | undefined>(undefined);
const repository = settingsRepository(AsyncStorage);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void repository.load().then((value) => {
      setSettings(value);
      setLoaded(true);
    });
  }, []);
  const update = useCallback((next: Partial<MobileSettings>) => {
    setSettings((current) => {
      const value = { ...current, ...next };
      void repository.save(value);
      return value;
    });
  }, []);
  return (
    <SettingsContext.Provider value={{ settings, loaded, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be inside SettingsProvider");
  return value;
}

interface TelemetryValue {
  envelope?: TelemetryEnvelope;
  connection: ConnectionState;
  scenario: FixtureScenario;
  setScenario: (scenario: FixtureScenario) => void;
  fixtureMode: boolean;
  lastReceivedAt?: number;
}

const TelemetryContext = createContext<TelemetryValue | undefined>(undefined);

export function TelemetryProvider({ children }: PropsWithChildren) {
  const { settings } = useSettings();
  const fixtureMode = process.env.EXPO_PUBLIC_RXOS_FIXTURE_MODE !== "false";
  const [scenario, setScenario] = useState<FixtureScenario>("parked-healthy");
  const [envelope, setEnvelope] = useState<TelemetryEnvelope | undefined>(() =>
    fixtureEnvelope("parked-healthy", new Date().toISOString()),
  );
  const [connection, setConnection] = useState<ConnectionState>({
    phase: "live",
    retryAttempt: 0,
    lastValidAt: Date.now(),
  });
  const [lastReceivedAt, setLastReceivedAt] = useState<number | undefined>(
    Date.now(),
  );

  useEffect(() => {
    if (!fixtureMode) return;
    if (scenario === "disconnected") {
      setConnection(initialConnectionState);
      return;
    }
    if (scenario === "invalid") {
      setConnection({
        phase: "invalid",
        retryAttempt: 0,
        invalidReason: "Fixture schema validation failed",
      });
      return;
    }
    const receivedAt = scenario === "stale" ? Date.now() - 10_000 : Date.now();
    setEnvelope(fixtureEnvelope(scenario, new Date(receivedAt).toISOString()));
    setLastReceivedAt(receivedAt);
    setConnection({
      phase: scenario === "stale" ? "stale" : "live",
      retryAttempt: 0,
      lastValidAt: receivedAt,
    });
  }, [fixtureMode, scenario]);

  useEffect(() => {
    if (fixtureMode) return;
    const client = new TelemetrySocket({
      url: `ws://${settings.simulatorHost}:${settings.simulatorPort}/telemetry`,
      onEnvelope: (next, receivedAt) => {
        setEnvelope(next);
        setLastReceivedAt(receivedAt);
        void AsyncStorage.setItem(
          "rxos.mobile.telemetry-cache.v1",
          JSON.stringify({ envelope: next, receivedAt }),
        );
      },
      onState: setConnection,
      log: settings.diagnosticLogging
        ? (entry) =>
            console.info(JSON.stringify({ component: "rxos-mobile", ...entry }))
        : undefined,
    });
    void AsyncStorage.getItem("rxos.mobile.telemetry-cache.v1").then((raw) => {
      if (!raw) return;
      try {
        const cached = JSON.parse(raw) as {
          envelope: TelemetryEnvelope;
          receivedAt: number;
        };
        setEnvelope((current) => current ?? cached.envelope);
        setLastReceivedAt((current) => current ?? cached.receivedAt);
      } catch {
        void AsyncStorage.removeItem("rxos.mobile.telemetry-cache.v1");
      }
    });
    client.start();
    const subscription = AppState.addEventListener("change", (state) =>
      state === "active" ? client.start() : client.stop(),
    );
    return () => {
      subscription.remove();
      client.stop();
    };
  }, [
    fixtureMode,
    settings.diagnosticLogging,
    settings.simulatorHost,
    settings.simulatorPort,
  ]);

  const value = useMemo(
    () => ({
      envelope,
      connection,
      scenario,
      setScenario,
      fixtureMode,
      lastReceivedAt,
    }),
    [connection, envelope, fixtureMode, lastReceivedAt, scenario],
  );
  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryValue {
  const value = useContext(TelemetryContext);
  if (!value) throw new Error("useTelemetry must be inside TelemetryProvider");
  return value;
}
