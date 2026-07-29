import { vehicleFixtures } from "@rxos/mobile-api-client";
import { Header, ListRow, Screen, Section, StatusPill } from "@/components";
import { useTelemetry } from "@/contexts";
import { View, Text } from "react-native";

export default function GarageScreen() {
  const vehicle = vehicleFixtures[0];
  const { connection, lastReceivedAt } = useTelemetry();
  return (
    <Screen>
      <Header
        eyebrow="Vehicles"
        title="Garage"
        detail="Structured for multiple vehicles; one development fixture is active."
      />
      <Section title="Active vehicle">
        <View className="rounded-3xl bg-rx-surface p-6">
          <View className="mb-8 flex-row items-start justify-between">
            <View>
              <Text className="text-3xl font-semibold text-rx-text">
                {vehicle?.name}
              </Text>
              <Text className="mt-2 text-rx-muted">
                {vehicle?.year} {vehicle?.make} {vehicle?.model}
              </Text>
            </View>
            <StatusPill label="Active" tone="success" />
          </View>
          <ListRow
            title="Connection method"
            value={vehicle?.connectionMethod}
          />
          <ListRow title="Simulator status" value={connection.phase} />
          <ListRow
            title="Last connected"
            value={
              lastReceivedAt
                ? new Date(lastReceivedAt).toLocaleString("en-GB")
                : "Never"
            }
          />
        </View>
      </Section>
      <Section title="Vehicles">
        <ListRow
          title="Your RX-8"
          detail="Active simulator fixture"
          value="Selected"
        />
        <ListRow
          title="Add another vehicle"
          detail="Unavailable in Milestone 1.7"
          disabled
        />
      </Section>
    </Screen>
  );
}
