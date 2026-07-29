import { describe, expect, it } from "vitest";
import {
  analyseTouchSession,
  createOcclusionReport,
  redactDiagnosticText,
  redactDiagnosticValue,
  simulatePowerCycle,
  svgReviewOverlay,
} from "../src/prototype-tools.js";

describe("prototype review tools", () => {
  it("reports possible occlusion without claiming physical verification", () => {
    const report = createOcclusionReport({
      displayWidthPx: 1920,
      displayHeightPx: 720,
      physicalWidthMm: 600,
      physicalHeightMm: 225,
      wheelDiameterMm: 360,
      wheelCentreXmm: 300,
      wheelCentreYmm: 150,
      criticalRegions: {
        speed: { x: 800, y: 250, width: 320, height: 220 },
        freshness: { x: 1600, y: 20, width: 260, height: 80 },
      },
    });
    expect(report.physicallyVerified).toBe(false);
    expect(
      report.regions.find((region) => region.name === "speed")?.occluded,
    ).toBe(true);
    expect(svgReviewOverlay("driver", 1920, 720, report)).toContain("<svg");
  });

  it("calculates touch misses and adjacent activation", () => {
    const result = analyseTouchSession(
      [{ id: "home", bounds: { x: 10, y: 10, width: 56, height: 56 } }],
      [
        {
          targetId: "home",
          x: 70,
          y: 38,
          durationMs: 120,
          activatedTargetId: "settings",
        },
      ],
    )[0];
    expect(result?.hit).toBe(false);
    expect(result?.missDistancePx).toBe(4);
    expect(result?.accidentalAdjacentActivation).toBe(true);
  });

  it("simulates graceful and interrupted power cycles", () => {
    expect(
      simulatePowerCycle([
        "off",
        "accessory",
        "ignition-on",
        "cranking",
        "running",
        "shutdown-requested",
        "graceful-shutdown",
        "off",
      ]).at(-1),
    ).toBe("off");
    expect(
      simulatePowerCycle([
        "off",
        "ignition-on",
        "running",
        "forced-power-loss",
        "off",
      ]).at(-1),
    ).toBe("off");
  });

  it("redacts secret-shaped fields recursively", () => {
    expect(
      redactDiagnosticValue({
        commit: "abc",
        accessToken: "private",
        nested: { password: "private", locale: "en-GB" },
      }),
    ).toEqual({
      commit: "abc",
      accessToken: "[REDACTED]",
      nested: { password: "[REDACTED]", locale: "en-GB" },
    });
  });

  it("redacts secret-shaped structured log text", () => {
    expect(
      redactDiagnosticText("token=abc Authorization: Bearer secret-value"),
    ).not.toContain("secret-value");
  });
});
