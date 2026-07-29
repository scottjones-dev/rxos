import { parsePairingPayload } from "@rxos/mobile-api-client";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Header, Screen, Section } from "@/components";
import { useSettings } from "@/contexts";

export default function PairingScreen() {
  const { settings, update } = useSettings();
  const [host, setHost] = useState(settings.simulatorHost);
  const [port, setPort] = useState(String(settings.simulatorPort));
  const [message, setMessage] = useState<string>();
  const save = () => {
    const payload = parsePairingPayload(
      JSON.stringify({
        host: host.trim(),
        port: Number(port),
        protocolVersion: 1,
        simulatorName: "RXOS Simulator",
      }),
    );
    if (!payload) {
      setMessage("Enter a valid loopback or private-network address and port.");
      return;
    }
    update({ simulatorHost: payload.host, simulatorPort: payload.port });
    setMessage("Development simulator address saved locally.");
  };
  return (
    <Screen>
      <Header
        eyebrow="Local development"
        title="Pair simulator"
        detail="Connect only to an RXOS Simulator on this device or your private local network. No secrets or cloud access."
      />
      <Section title="Manual address">
        <Text className="mb-2 text-sm text-rx-muted">Host</Text>
        <TextInput
          accessibilityLabel="Simulator host"
          autoCapitalize="none"
          autoCorrect={false}
          value={host}
          onChangeText={setHost}
          placeholder="192.168.1.20"
          placeholderTextColor="#666B75"
          className="mb-5 min-h-14 rounded-2xl bg-rx-surface px-4 text-lg text-rx-text"
        />
        <Text className="mb-2 text-sm text-rx-muted">Port</Text>
        <TextInput
          accessibilityLabel="Simulator port"
          keyboardType="number-pad"
          value={port}
          onChangeText={setPort}
          placeholder="8787"
          placeholderTextColor="#666B75"
          className="mb-5 min-h-14 rounded-2xl bg-rx-surface px-4 text-lg text-rx-text"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save simulator address"
          onPress={save}
          className="min-h-14 items-center justify-center rounded-2xl bg-rx-accent px-5"
        >
          <Text className="font-semibold text-rx-bg">Save address</Text>
        </Pressable>
        {message ? (
          <Text
            accessibilityRole="alert"
            className="mt-4 leading-6 text-rx-muted"
          >
            {message}
          </Text>
        ) : null}
      </Section>
      <Section title="Development QR">
        <View className="rounded-2xl bg-rx-surface p-5">
          <Text className="font-semibold text-rx-text">
            QR scanning is prepared, not enabled.
          </Text>
          <Text className="mt-2 leading-6 text-rx-muted">
            The validated payload contains host, port, protocol version, and
            simulator name only. Camera permission is not requested in this
            milestone.
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
