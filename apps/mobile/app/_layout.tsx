import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SettingsProvider, TelemetryProvider } from "@/contexts";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: Number.POSITIVE_INFINITY, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TelemetryProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#090A0C" },
              headerTintColor: "#F4F2ED",
              headerShadowVisible: false,
              contentStyle: { backgroundColor: "#090A0C" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="health" options={{ title: "Vehicle health" }} />
            <Stack.Screen name="trip/[id]" options={{ title: "Trip detail" }} />
            <Stack.Screen
              name="pairing"
              options={{ title: "Development pairing" }}
            />
            <Stack.Screen
              name="development"
              options={{ title: "Fixture scenarios" }}
            />
          </Stack>
        </TelemetryProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
