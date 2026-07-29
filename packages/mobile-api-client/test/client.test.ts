import { describe, expect, it } from "vitest";
import {
  defaultSettings,
  deriveFreshness,
  fixtureEnvelope,
  formatDate,
  formatDistance,
  formatSpeed,
  parsePairingPayload,
  parseTelemetryMessage,
  reduceConnection,
  retryDelay,
  settingsRepository,
  tripFixtures,
} from "../src/index.js";

describe("telemetry", () => {
  it("parses the shared envelope", () => {
    expect(
      parseTelemetryMessage(JSON.stringify(fixtureEnvelope("normal-driving")))
        .envelope?.telemetry.speedKph,
    ).toBe(72);
  });
  it("rejects invalid and unsupported telemetry", () => {
    expect(parseTelemetryMessage("{").error).toBeDefined();
    expect(parseTelemetryMessage('{"schemaVersion":2}').error).toContain(
      "schema",
    );
  });
  it("derives freshness without inventing values", () => {
    expect(deriveFreshness(undefined, 2_000)).toBe("lost");
    expect(deriveFreshness(1_000, 2_000)).toBe("live");
    expect(deriveFreshness(1_000, 2_501)).toBe("stale");
  });
  it("transitions through invalid and reconnecting states", () => {
    const live = reduceConnection(
      { phase: "connecting", retryAttempt: 0 },
      { type: "valid", receivedAt: 10 },
    );
    expect(
      reduceConnection(live, { type: "invalid", reason: "bad" }).phase,
    ).toBe("invalid");
    expect(
      reduceConnection(live, { type: "close", willRetry: true }).phase,
    ).toBe("reconnecting");
  });
  it("bounds exponential backoff", () => expect(retryDelay(20)).toBe(30_000));
});

describe("pairing", () => {
  it("accepts local non-sensitive payloads", () => {
    expect(
      parsePairingPayload(
        '{"host":"192.168.1.20","port":8787,"protocolVersion":1,"simulatorName":"Desk"}',
      ),
    ).toBeDefined();
  });
  it("rejects internet hosts, secrets, and invalid ports", () => {
    expect(
      parsePairingPayload(
        '{"host":"example.com","port":8787,"protocolVersion":1,"simulatorName":"Desk"}',
      ),
    ).toBeUndefined();
    expect(
      parsePairingPayload(
        '{"host":"127.0.0.1","port":0,"protocolVersion":1,"simulatorName":"Desk","token":"x"}',
      ),
    ).toBeUndefined();
  });
});

describe("local domain", () => {
  it("formats UK units and dates", () => {
    expect(formatDistance(29.6, "uk")).toBe("18.4 miles");
    expect(formatSpeed(100, "uk")).toBe("62 mph");
    expect(formatDate("2026-07-29T17:14:00.000Z")).toContain("29 Jul 2026");
  });
  it("keeps trip fixtures deterministic", () =>
    expect(tripFixtures[0]?.id).toBe("trip-2026-07-29"));
  it("persists dashboard preference", async () => {
    let value: string | null = null;
    const repository = settingsRepository({
      getItem: async () => value,
      setItem: async (_key, next) => {
        value = next;
      },
    });
    await repository.save({ ...defaultSettings, dashboardMode: "track" });
    expect((await repository.load()).dashboardMode).toBe("track");
  });
});
