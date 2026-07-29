import {
  formatDate,
  formatDistance,
  formatSpeed,
  tripFixtures,
} from "@rxos/mobile-api-client";
import { useLocalSearchParams } from "expo-router";
import {
  EmptyState,
  Header,
  ListRow,
  Metric,
  Screen,
  Section,
} from "@/components";
import { useSettings } from "@/contexts";
import { View, Text } from "react-native";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  const trip = tripFixtures.find((item) => item.id === id);
  if (!trip)
    return (
      <Screen>
        <EmptyState
          title="Trip unavailable"
          detail="This deterministic fixture could not be found."
        />
      </Screen>
    );
  return (
    <Screen>
      <Header
        eyebrow={formatDate(trip.startedAt)}
        title={`${trip.startLabel} to ${trip.destinationLabel}`}
        detail="Fixture journey · No real location data"
      />
      <Section title="Journey">
        <View className="flex-row flex-wrap gap-x-8">
          <Metric
            label="Distance"
            value={
              formatDistance(trip.distanceKm, settings.units).split(" ")[0] ??
              "—"
            }
            unit={settings.units === "uk" ? "miles" : "km"}
          />
          <Metric
            label="Duration"
            value={trip.durationMinutes}
            unit="minutes"
          />
          <Metric
            label="Average speed"
            value={
              formatSpeed(trip.averageSpeedKph, settings.units).split(" ")[0] ??
              "—"
            }
            unit={settings.units === "uk" ? "mph" : "km/h"}
          />
          <Metric
            label="Fuel-use estimate"
            value={trip.fuelUsedLitres?.toFixed(1) ?? "Unavailable"}
            unit={trip.fuelUsedLitres ? "L · simulated" : undefined}
          />
        </View>
      </Section>
      <Section title="Route summary">
        <View className="rounded-3xl bg-rx-surface p-6">
          <Text className="text-lg font-semibold text-rx-text">
            {trip.startLabel}
          </Text>
          <View className="my-3 h-14 w-px bg-rx-border" />
          <Text className="text-lg font-semibold text-rx-text">
            {trip.destinationLabel}
          </Text>
          <Text className="mt-6 text-sm leading-5 text-rx-muted">
            Static fixture labels only. RXOS Companion does not request location
            permission or display a map.
          </Text>
        </View>
      </Section>
      <Section title="Details">
        <ListRow title="Started" value={formatDate(trip.startedAt)} />
        <ListRow title="Source" value="Deterministic fixture" />
      </Section>
    </Screen>
  );
}
