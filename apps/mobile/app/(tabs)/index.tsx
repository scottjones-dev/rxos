import { formatDistance, tripFixtures } from "@rxos/mobile-api-client";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  ConnectionBanner,
  Header,
  ListRow,
  Metric,
  Screen,
  Section,
  StatusPill,
  WarningBanner,
} from "@/components";
import { useSettings, useTelemetry } from "@/contexts";

export default function HomeScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const { connection, envelope, lastReceivedAt } = useTelemetry();
  const telemetry = envelope?.telemetry;
  const warnings = telemetry
    ? Object.entries(telemetry.warnings).filter(([, active]) => active)
    : [];
  const notLive = connection.phase !== "live";
  return (
    <Screen>
      <Header
        eyebrow="RXOS Companion"
        title="Your RX-8"
        detail="Simulator-derived status · Read-only"
      />
      <ConnectionBanner
        phase={connection.phase}
        cached={notLive && Boolean(envelope)}
      />
      <View className="mb-10">
        <View className="mb-7 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-medium text-rx-text">
              {(telemetry?.speedKph ?? 0) > 0 ? "Simulated driving" : "Parked"}
            </Text>
            <Text className="mt-1 text-rx-muted">
              {lastReceivedAt
                ? `Last connected ${new Date(lastReceivedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                : "Never connected"}
            </Text>
          </View>
          <StatusPill
            label={connection.phase}
            tone={
              connection.phase === "live"
                ? "success"
                : connection.phase === "invalid"
                  ? "critical"
                  : "warning"
            }
          />
        </View>
        <View className="flex-row flex-wrap gap-x-8">
          <Metric
            label="Fuel"
            value={telemetry ? Math.round(telemetry.fuelPercent) : "—"}
            unit="%"
            muted={notLive}
          />
          <Metric
            label="Estimated range"
            value={telemetry ? Math.round(telemetry.fuelPercent * 2.95) : "—"}
            unit="miles · fixture"
            muted={notLive}
          />
          <Metric
            label="Battery"
            value={telemetry?.batteryVoltage.toFixed(1) ?? "—"}
            unit="V"
            muted={notLive}
          />
        </View>
      </View>
      <Section
        title="Vehicle health"
        action={
          <Link href="/health" className="text-rx-accent">
            View details
          </Link>
        }
      >
        {warnings.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View vehicle health, everything looks healthy"
            onPress={() => router.push("/health")}
            className="rounded-3xl bg-rx-surface p-6"
          >
            <Text className="text-2xl font-medium text-rx-text">
              Everything looks healthy.
            </Text>
            <Text className="mt-2 leading-6 text-rx-muted">
              Based on the latest validated simulator telemetry.
            </Text>
          </Pressable>
        ) : (
          warnings.map(([key]) => (
            <WarningBanner
              key={key}
              title="Simulated warning detected"
              detail={`${key} is active in the current fixture. This is not a mechanical diagnosis.`}
              critical={key !== "lowFuel"}
            />
          ))
        )}
      </Section>
      <Section title="Latest trip">
        <ListRow
          title={`${tripFixtures[0]?.startLabel} to ${tripFixtures[0]?.destinationLabel}`}
          detail={`${tripFixtures[0]?.durationMinutes} minutes · fixture route`}
          value={
            tripFixtures[0]
              ? formatDistance(tripFixtures[0].distanceKm, settings.units)
              : "—"
          }
          onPress={() => router.push(`/trip/${tripFixtures[0]?.id}`)}
        />
      </Section>
      <Section title="Quick access">
        <ListRow
          title="Live vehicle data"
          detail="Validated speed, RPM, temperatures and freshness"
          onPress={() => router.push("/(tabs)/vehicle")}
        />
        <ListRow
          title="Preferred RXOS driver layout"
          value={
            settings.dashboardMode[0]?.toUpperCase() +
            settings.dashboardMode.slice(1)
          }
          onPress={() => router.push("/(tabs)/settings")}
        />
      </Section>
    </Screen>
  );
}
