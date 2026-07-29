import {
  Header,
  ListRow,
  Screen,
  Section,
  StatusPill,
  WarningBanner,
} from "@/components";
import { useTelemetry } from "@/contexts";
import { Text, View } from "react-native";

export default function HealthScreen() {
  const { envelope, connection, lastReceivedAt, scenario } = useTelemetry();
  const telemetry = envelope?.telemetry;
  const warnings = telemetry
    ? Object.entries(telemetry.warnings).filter(([, value]) => value)
    : [];
  const confidence =
    connection.phase === "live"
      ? "Current validated telemetry"
      : connection.phase === "stale"
        ? "Stale validated telemetry"
        : "Unavailable";
  return (
    <Screen>
      <Header
        eyebrow="Simulator-derived"
        title="Vehicle health"
        detail="A plain-language summary of available telemetry, not a mechanical diagnosis."
      />
      <View className="mb-10 rounded-3xl bg-rx-surface p-6">
        <StatusPill
          label={
            warnings.length === 0 && connection.phase === "live"
              ? "Healthy"
              : connection.phase
          }
          tone={
            warnings.length === 0 && connection.phase === "live"
              ? "success"
              : connection.phase === "invalid"
                ? "critical"
                : "warning"
          }
        />
        <Text className="mt-5 text-3xl font-medium text-rx-text">
          {warnings.length === 0
            ? "Everything looks healthy."
            : "Simulator warnings need attention."}
        </Text>
        <Text className="mt-3 leading-6 text-rx-muted">
          This summary reflects the last validated RXOS Simulator snapshot.
          Continue to use factory instrumentation.
        </Text>
      </View>
      <Section title="Active warnings">
        {warnings.length === 0 ? (
          <Text className="text-rx-text">No active simulator warnings.</Text>
        ) : (
          warnings.map(([key]) => (
            <WarningBanner
              key={key}
              title={key}
              detail="Active in simulator telemetry. No condition has been mechanically diagnosed."
              critical={key !== "lowFuel"}
            />
          ))
        )}
      </Section>
      <Section title="Telemetry summary">
        <ListRow
          title="Coolant temperature"
          detail={
            telemetry
              ? `${telemetry.coolantTempC.toFixed(0)} °C reported by the simulator`
              : "Unavailable"
          }
          value={
            telemetry?.warnings.coolantTemperature
              ? "Warning"
              : telemetry
                ? "No warning"
                : "Unknown"
          }
        />
        <ListRow
          title="Battery voltage"
          detail={
            telemetry
              ? `${telemetry.batteryVoltage.toFixed(1)} V reported by the simulator`
              : "Unavailable"
          }
          value={
            !telemetry
              ? "Unknown"
              : scenario === "battery-warning"
                ? "Warning fixture"
                : "No simulator warning"
          }
        />
        <ListRow title="Telemetry confidence" value={confidence} />
        <ListRow
          title="Last successful connection"
          value={
            lastReceivedAt
              ? new Date(lastReceivedAt).toLocaleString("en-GB")
              : "Unavailable"
          }
        />
        <ListRow
          title="Unavailable systems"
          detail="Intake temperature, maintenance diagnosis, factory diagnostics"
        />
      </Section>
      <Section title="Resolved warnings">
        <Text className="leading-6 text-rx-muted">
          Warning history is not yet supplied by the simulator. A dismissed item
          would not imply that a physical condition was resolved.
        </Text>
      </Section>
    </Screen>
  );
}
