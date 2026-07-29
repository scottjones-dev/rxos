import { useRouter } from "expo-router";
import {
  Header,
  ListRow,
  Screen,
  Section,
  SegmentedControl,
} from "@/components";
import { useSettings, useTelemetry } from "@/contexts";

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const { fixtureMode } = useTelemetry();
  return (
    <Screen>
      <Header
        eyebrow="Preferences"
        title="Settings"
        detail="Local presentation preferences. They do not alter a physical vehicle."
      />
      <Section title="Units and appearance">
        <SegmentedControl
          label="Units"
          value={settings.units}
          onChange={(units) => update({ units })}
          options={[
            { label: "UK", value: "uk" },
            { label: "Metric", value: "metric" },
          ]}
        />
        <ListRow title="Locale" value="English (UK)" />
        <ListRow
          title="Theme"
          value={settings.theme === "dark" ? "Dark" : "System"}
          onPress={() =>
            update({ theme: settings.theme === "dark" ? "system" : "dark" })
          }
        />
        <ListRow
          title="Accent preference"
          value={settings.accent}
          onPress={() =>
            update({
              accent:
                settings.accent === "blue"
                  ? "violet"
                  : settings.accent === "violet"
                    ? "green"
                    : "blue",
            })
          }
        />
        <ListRow
          title="Reduced motion"
          value={settings.reducedMotion ? "On" : "Off"}
          onPress={() => update({ reducedMotion: !settings.reducedMotion })}
        />
      </Section>
      <Section title="Preferred RXOS driver layout">
        <SegmentedControl
          label="Preferred RXOS driver layout"
          value={settings.dashboardMode}
          onChange={(dashboardMode) => update({ dashboardMode })}
          options={[
            { label: "Road", value: "road" },
            { label: "Sport", value: "sport" },
            { label: "Track", value: "track" },
          ]}
        />
        <ListRow
          title="Default driver mode"
          detail="Mobile-side preference and simulator mock only"
          value={settings.dashboardMode}
        />
      </Section>
      <Section title="Connection">
        <ListRow
          title="Simulator address"
          value={`${settings.simulatorHost}:${settings.simulatorPort}`}
          onPress={() => router.push("/pairing")}
        />
        <ListRow
          title="Connection mode"
          value={fixtureMode ? "Deterministic fixtures" : "Local WebSocket"}
        />
        {__DEV__ ? (
          <ListRow
            title="Fixture scenarios"
            detail="Development only"
            onPress={() => router.push("/development")}
          />
        ) : null}
      </Section>
      <Section title="Notifications">
        <ListRow
          title="Local notification examples"
          detail={
            settings.notificationsEnabled
              ? "Mock triggers enabled"
              : "Review before opting in; no permission requested yet"
          }
          value={settings.notificationsEnabled ? "On" : "Off"}
          onPress={() =>
            update({ notificationsEnabled: !settings.notificationsEnabled })
          }
        />
        <ListRow
          title="Examples"
          detail="Disconnect, warning, maintenance reminder, trip complete"
        />
      </Section>
      <Section title="Privacy and diagnostics">
        <ListRow
          title="Diagnostic logging"
          detail="Structured application lifecycle and connection events"
          value={settings.diagnosticLogging ? "On" : "Off"}
          onPress={() =>
            update({ diagnosticLogging: !settings.diagnosticLogging })
          }
        />
        <ListRow
          title="Privacy"
          detail="No account, cloud, location, camera, or physical vehicle control"
        />
        <ListRow title="App information" value="RXOS Companion 0.1.0" />
      </Section>
    </Screen>
  );
}
