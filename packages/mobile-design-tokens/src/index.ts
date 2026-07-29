export const colours = {
  background: "#090A0C",
  surface: "#121419",
  surfaceRaised: "#1A1D23",
  text: "#F4F2ED",
  textMuted: "#969BA5",
  textFaint: "#666B75",
  accent: "#8AB4FF",
  success: "#6FD59A",
  warning: "#F0B75A",
  critical: "#FF6B6B",
  border: "#272A31",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 48,
} as const;

export const radii = { small: 10, medium: 16, large: 24, panel: 32 } as const;
export const typeScale = {
  micro: 12,
  label: 14,
  body: 17,
  heading: 26,
  hero: 44,
  instrument: 64,
} as const;
export const motion = {
  micro: 90,
  fast: 140,
  standard: 220,
  settle: 360,
} as const;
export const iconSizes = { small: 18, standard: 22, large: 28 } as const;
export const minimumTouchTarget = 48;

export type WarningPriority = "info" | "warning" | "critical";

export function warningPriority(key: string): WarningPriority {
  if (key === "lowOilPressure" || key === "coolantTemperature")
    return "critical";
  if (key === "checkEngine" || key === "lowFuel") return "warning";
  return "info";
}
