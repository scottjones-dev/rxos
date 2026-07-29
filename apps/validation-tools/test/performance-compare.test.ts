import { describe, expect, it } from "vitest";
import {
  compareReports,
  stableInvariantFailures,
} from "../src/performance-compare.js";

const environment = {
  platform: "linux",
  architecture: "x64",
  buildType: "Release",
  qtPlatform: "offscreen",
  renderingBackend: "software",
  screenProfiles: { driver: "2560x720", cabin: "1920x1080" },
};

describe("native performance comparison", () => {
  it("rejects environment mismatches", () => {
    const result = compareReports(
      { environment, runs: [] },
      {
        environment: { ...environment, buildType: "Debug" },
        runs: [],
      },
    );
    expect(result.comparable).toBe(false);
    expect(result.reason).toBe("environment mismatch");
  });

  it("checks only deterministic stable invariants", () => {
    expect(
      stableInvariantFailures({
        schemaVersion: 2,
        runs: [
          {
            topology: "cabin",
            nativeLogs: [
              {
                component: "cabin-display",
                event: "shutdown_summary",
                accepted: 100,
                hiddenWork: 0,
                chartRenderedPoints: 240,
              },
            ],
          },
        ],
      }),
    ).toEqual([]);
  });
});
