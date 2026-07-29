import {
  formatDate,
  formatDistance,
  formatSpeed,
  tripFixtures,
} from "@rxos/mobile-api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  Section,
} from "@/components";
import { useSettings } from "@/contexts";

export default function TripsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: async () => tripFixtures,
  });
  return (
    <Screen>
      <Header
        eyebrow="History"
        title="Trips"
        detail="Deterministic fixture journeys. Location tracking is not enabled."
      />
      {trips.isLoading ? (
        <LoadingState />
      ) : trips.isError ? (
        <ErrorState message="Trip fixtures could not be loaded." />
      ) : trips.data?.length === 0 ? (
        <EmptyState
          title="No trips yet"
          detail="Completed simulator trips will appear here."
        />
      ) : (
        <Section title="Recent journeys">
          {trips.data?.map((trip) => (
            <ListRow
              key={trip.id}
              title={`${trip.startLabel} to ${trip.destinationLabel}`}
              detail={`${formatDate(trip.startedAt)} · ${trip.durationMinutes} min · avg ${formatSpeed(trip.averageSpeedKph, settings.units)}`}
              value={formatDistance(trip.distanceKm, settings.units)}
              onPress={() => router.push(`/trip/${trip.id}`)}
            />
          ))}
        </Section>
      )}
    </Screen>
  );
}
