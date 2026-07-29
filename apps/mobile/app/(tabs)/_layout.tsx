import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";

const icon =
  (label: string) =>
  ({ color }: { color: ColorValue }) => (
    <Text style={{ color, fontSize: 13, fontWeight: "700" }}>{label}</Text>
  );

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8AB4FF",
        tabBarInactiveTintColor: "#777C86",
        tabBarStyle: {
          backgroundColor: "#101216",
          borderTopColor: "#272A31",
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: icon("H") }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: "Trips", tabBarIcon: icon("T") }}
      />
      <Tabs.Screen
        name="vehicle"
        options={{ title: "Vehicle", tabBarIcon: icon("V") }}
      />
      <Tabs.Screen
        name="garage"
        options={{ title: "Garage", tabBarIcon: icon("G") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: icon("S") }}
      />
    </Tabs>
  );
}
