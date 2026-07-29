import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  ConnectionBanner,
  Header,
  ListRow,
  Metric,
  Screen,
  Section,
  WarningBanner,
} from "@/components";
import { useSettings, useTelemetry } from "@/contexts";
import { formatSpeed } from "@rxos/mobile-api-client";
import { useRouter } from "expo-router";

export default function VehicleScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const { envelope, connection, lastReceivedAt } = useTelemetry();
  const [advanced, setAdvanced] = useState(false);
  const telemetry = envelope?.telemetry;
  const warningEntries = telemetry
    ? Object.entries(telemetry.warnings).filter(([, active]) => active)
    : [];
  const unavailable =
    connection.phase === "disconnected" || connection.phase === "invalid";
  return (
    <Screen>
      <Header
        eyebrow="Live status"
        title="Vehicle"
        detail="Human-readable, read-only information from the RXOS Simulator."
      />
      <ConnectionBanner
        phase={connection.phase}
        cached={connection.phase !== "live" && Boolean(envelope)}
      />
      <Section title="Driving summary">
        <View className="flex-row flex-wrap gap-x-8">
          <Metric
            label="Speed"
            value={
              telemetry
                ? (formatSpeed(telemetry.speedKph, settings.units).split(
                    " ",
                  )[0] ?? "—")
                : "—"
            }
            unit={settings.units === "uk" ? "mph" : "km/h"}
            muted={unavailable}
          />
          <Metric
            label="Engine speed"
            value={
              telemetry
                ? Math.round(telemetry.rpm).toLocaleString("en-GB")
                : "—"
            }
            unit="rpm"
            muted={unavailable}
          />
          <Metric
            label="Selected gear"
            value={telemetry?.gear ?? "—"}
            muted={unavailable}
          />
          <Metric
            label="Throttle"
            value={telemetry ? Math.round(telemetry.throttlePercent) : "—"}
            unit="%"
            muted={unavailable}
          />
        </View>
      </Section>
      <Section title="Energy">
        <View className="flex-row flex-wrap gap-x-8">
          <Metric
            label="Fuel"
            value={telemetry ? Math.round(telemetry.fuelPercent) : "—"}
            unit="%"
          />
          <Metric
            label="Battery"
            value={telemetry?.batteryVoltage.toFixed(1) ?? "—"}
            unit="V"
          />
        </View>
      </Section>
      <Section title="Temperatures">
        <View className="flex-row flex-wrap gap-x-8">
          <Metric
            label="Coolant"
            value={telemetry?.coolantTempC.toFixed(0) ?? "—"}
            unit="°C"
          />
          <Metric
            label="Oil"
            value={telemetry?.oilTempC.toFixed(0) ?? "—"}
            unit="°C"
          />
          <Metric label="Intake" value="Unavailable" muted />
        </View>
      </Section>
      <Section title="Warnings">
        {warningEntries.length ? (
          warningEntries.map(([key]) => (
            <WarningBanner
              key={key}
              title={
                key === "lowFuel" ? "Low fuel fixture" : "Simulated warning"
              }
              detail={`${key} is reported by simulator telemetry. Factory instrumentation remains authoritative.`}
              critical={key !== "lowFuel"}
            />
          ))
        ) : (
          <Text className="text-lg text-rx-text">
            No active simulator warnings.
          </Text>
        )}
      </Section>
      <Section title="Connection and diagnostics">
        <ListRow title="Freshness" value={connection.phase} />
        <ListRow
          title="Last simulator update"
          value={
            lastReceivedAt
              ? new Date(lastReceivedAt).toLocaleTimeString("en-GB")
              : "Unavailable"
          }
        />
        <ListRow
          title="Vehicle health"
          onPress={() => router.push("/health")}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdvanced((value) => !value)}
          className="min-h-12 justify-center"
        >
          <Text className="font-semibold text-rx-accent">
            {advanced ? "Hide" : "Show"} technical details
          </Text>
        </Pressable>
        {advanced ? (
          <View className="mt-3 rounded-2xl bg-rx-surface p-5">
            <Text className="font-mono text-sm leading-6 text-rx-muted">
              Schema v{envelope?.schemaVersion ?? "—"}
              {"\n"}Sequence {envelope?.sequence ?? "—"}
              {"\n"}Source {envelope?.source ?? "—"}
              {"\n"}Oil pressure {telemetry?.oilPressureKpa ?? "—"} kPa
            </Text>
          </View>
        ) : null}
      </Section>
    </Screen>
  );
}
