import { colours } from "@rxos/mobile-design-tokens";
import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  const content = (
    <View className="mx-auto w-full max-w-3xl px-6 pb-12 pt-4">{children}</View>
  );
  return (
    <SafeAreaView className="flex-1 bg-rx-bg" edges={["top"]}>
      {scroll ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Header({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
}) {
  return (
    <View className="mb-10 gap-2">
      {eyebrow ? (
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-rx-accent">
          {eyebrow}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        className="text-4xl font-semibold tracking-tight text-rx-text"
      >
        {title}
      </Text>
      {detail ? (
        <Text className="max-w-xl text-base leading-6 text-rx-muted">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export function Section({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <View className="mb-10">
      <View className="mb-4 flex-row items-center justify-between">
        <Text
          accessibilityRole="header"
          className="text-xl font-semibold text-rx-text"
        >
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "critical";
}) {
  const styles =
    tone === "success"
      ? "bg-rx-success/15 text-rx-success"
      : tone === "warning"
        ? "bg-rx-warning/15 text-rx-warning"
        : tone === "critical"
          ? "bg-rx-critical/15 text-rx-critical"
          : "bg-rx-raised text-rx-muted";
  return (
    <View
      className={`self-start rounded-full px-3 py-2 ${styles.split(" ")[0]}`}
    >
      <Text
        className={`text-xs font-semibold uppercase tracking-wider ${styles.split(" ")[1]}`}
      >
        {label}
      </Text>
    </View>
  );
}

export function ConnectionBanner({
  phase,
  cached,
}: {
  phase: string;
  cached?: boolean;
}) {
  const live = phase === "live";
  const critical = phase === "invalid" || phase === "disconnected";
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`Telemetry ${phase}${cached ? ", showing cached data" : ""}`}
      className={`mb-7 flex-row items-center justify-between rounded-2xl px-4 py-4 ${live ? "bg-rx-success/10" : critical ? "bg-rx-critical/10" : "bg-rx-warning/10"}`}
    >
      <View>
        <Text
          className={`font-semibold ${live ? "text-rx-success" : critical ? "text-rx-critical" : "text-rx-warning"}`}
        >
          {phase === "live"
            ? "Simulator connected"
            : phase === "stale"
              ? "Telemetry is stale"
              : phase === "invalid"
                ? "Invalid telemetry rejected"
                : phase === "reconnecting"
                  ? "Reconnecting to simulator"
                  : phase === "connecting"
                    ? "Connecting to simulator"
                    : "Simulator unavailable"}
        </Text>
        {cached ? (
          <Text className="mt-1 text-sm text-rx-muted">
            Last known values — not live
          </Text>
        ) : null}
      </View>
      <Text className="text-rx-muted">●</Text>
    </View>
  );
}

export function Metric({
  label,
  value,
  unit,
  muted,
}: {
  label: string;
  value: string | number;
  unit?: string;
  muted?: boolean;
}) {
  return (
    <View className="min-w-36 flex-1 py-3">
      <Text className="mb-2 text-sm text-rx-muted">{label}</Text>
      <View className="flex-row items-baseline gap-2">
        <Text
          className={`text-3xl font-medium tracking-tight ${muted ? "text-rx-muted" : "text-rx-text"}`}
        >
          {value}
        </Text>
        {unit ? <Text className="text-sm text-rx-muted">{unit}</Text> : null}
      </View>
    </View>
  );
}

export function ListRow({
  title,
  detail,
  value,
  onPress,
  disabled,
}: {
  title: string;
  detail?: string;
  value?: string;
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${title}${value ? `, ${value}` : ""}`}
      disabled={disabled || !onPress}
      onPress={onPress}
      className={`min-h-16 flex-row items-center justify-between border-b border-rx-border py-4 ${disabled ? "opacity-40" : ""}`}
    >
      <View className="mr-4 flex-1">
        <Text className="text-base font-medium text-rx-text">{title}</Text>
        {detail ? (
          <Text className="mt-1 text-sm leading-5 text-rx-muted">{detail}</Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        {value ? <Text className="text-sm text-rx-muted">{value}</Text> : null}
        {onPress ? <Text className="text-rx-faint">›</Text> : null}
      </View>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View
      accessibilityLabel={label}
      className="flex-row rounded-2xl bg-rx-surface p-1"
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          className={`min-h-12 flex-1 items-center justify-center rounded-xl px-3 ${value === option.value ? "bg-rx-raised" : ""}`}
        >
          <Text
            className={`font-semibold ${value === option.value ? "text-rx-text" : "text-rx-muted"}`}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function WarningBanner({
  title,
  detail,
  critical = false,
}: {
  title: string;
  detail: string;
  critical?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      className={`mb-3 rounded-2xl border p-4 ${critical ? "border-rx-critical/30 bg-rx-critical/10" : "border-rx-warning/30 bg-rx-warning/10"}`}
    >
      <Text
        className={`font-semibold ${critical ? "text-rx-critical" : "text-rx-warning"}`}
      >
        {title}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-rx-muted">{detail}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <View className="items-center py-16">
      <Text className="text-xl font-semibold text-rx-text">{title}</Text>
      <Text className="mt-2 max-w-sm text-center leading-6 text-rx-muted">
        {detail}
      </Text>
    </View>
  );
}

export function LoadingState() {
  return (
    <View accessibilityLabel="Loading" className="items-center py-16">
      <ActivityIndicator color={colours.accent} />
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="rounded-2xl bg-rx-critical/10 p-5"
    >
      <Text className="font-semibold text-rx-critical">Unable to load</Text>
      <Text className="mt-1 text-rx-muted">{message}</Text>
    </View>
  );
}
