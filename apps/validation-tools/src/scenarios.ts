export type DisplayName = "driver" | "cabin";

export interface VisualScenario {
  readonly name: string;
  readonly display: DisplayName;
  readonly locale?: string;
  readonly units?: "metric" | "uk" | "us";
  readonly scale?: number;
}

const driverNames = [
  "daily-day",
  "daily-night",
  "performance-night",
  "track-night",
  "stale",
  "disconnected",
  "reconnected",
  "advisory",
  "caution-high-coolant",
  "critical-low-oil",
  "multiple-low-fuel",
  "maximum-rpm-high-speed",
  "high-contrast",
  "reduced-motion",
] as const;

const cabinNames = [
  "home-day",
  "home-night",
  "navigation",
  "media",
  "vehicle",
  "performance",
  "diagnostics",
  "settings",
  "stale",
  "disconnected",
  "advisory",
  "caution-high-coolant",
  "critical-low-oil",
  "multiple-low-fuel",
  "touch-focus",
  "high-contrast",
  "reduced-motion",
] as const;

export const visualScenarios: readonly VisualScenario[] = [
  ...driverNames.map((name) => ({ name, display: "driver" as const })),
  ...cabinNames.map((name) => ({ name, display: "cabin" as const })),
  { name: "pseudo-expanded", display: "driver", locale: "en-XA" },
  { name: "pseudo-rtl", display: "driver", locale: "ar-XB" },
  { name: "pseudo-expanded", display: "cabin", locale: "en-XA" },
  { name: "pseudo-rtl", display: "cabin", locale: "ar-XB" },
  { name: "uk-units", display: "driver", units: "uk" },
  { name: "us-units", display: "cabin", units: "us" },
  { name: "minimum-scale", display: "driver", scale: 0.8 },
  { name: "maximum-scale", display: "driver", scale: 1.25 },
  { name: "minimum-scale", display: "cabin", scale: 0.8 },
  { name: "maximum-scale", display: "cabin", scale: 1.25 },
];

export const contentStressScenarios = [
  "maximum-rpm",
  "zero-speed",
  "high-speed",
  "long-gear-fallback",
  "multiple-warnings",
  "maximum-warning-title",
  "maximum-warning-message",
  "missing-optional-telemetry",
  "all-telemetry-unavailable",
  "rapid-warning-changes",
  "rapid-mode-changes",
  "rapid-theme-changes",
  "low-fuel",
  "high-coolant",
  "high-oil",
  "low-oil-pressure",
  "malformed-between-valid",
  "variable-rate-1-10-20-60",
  "midnight-crossing",
  "long-duration",
  "large-diagnostic-counters",
] as const;

export function outputName(scenario: VisualScenario): string {
  return `${scenario.display}-${scenario.name}.png`;
}
