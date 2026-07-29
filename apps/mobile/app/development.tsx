import type { FixtureScenario } from "@rxos/mobile-api-client";
import { Header, ListRow, Screen, Section } from "@/components";
import { useTelemetry } from "@/contexts";

const scenarios: readonly FixtureScenario[] = [
  "parked-healthy",
  "normal-driving",
  "motorway-driving",
  "high-rpm",
  "low-fuel",
  "battery-warning",
  "high-coolant",
  "stale",
  "disconnected",
  "invalid",
];

export default function DevelopmentScreen() {
  const { scenario, setScenario, fixtureMode } = useTelemetry();
  return (
    <Screen>
      <Header
        eyebrow="Development only"
        title="Fixture scenarios"
        detail={
          fixtureMode
            ? "Deterministic scenario selection is active."
            : "Set EXPO_PUBLIC_RXOS_FIXTURE_MODE=true to use fixtures."
        }
      />
      <Section title="Telemetry state">
        {scenarios.map((item) => (
          <ListRow
            key={item}
            title={item.replaceAll("-", " ")}
            value={scenario === item ? "Selected" : undefined}
            onPress={() => setScenario(item)}
          />
        ))}
      </Section>
      <Section title="Additional fixtures">
        <ListRow
          title="Completed trip"
          detail="Available in Trips"
          value="Loaded"
        />
        <ListRow
          title="Maintenance reminder"
          detail="Available as a mock notification example"
          value="Prepared"
        />
      </Section>
    </Screen>
  );
}
