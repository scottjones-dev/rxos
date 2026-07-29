export const rxosConfig = {
  telemetryUrl: "ws://127.0.0.1:8787/telemetry",
  telemetryHz: 10,
  staleAfterMs: 1_500,
} as const;

export * from "./prototype.js";
