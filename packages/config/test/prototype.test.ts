import { describe, expect, it } from "vitest";
import {
  applyRotaryAction,
  assignDisplayRoles,
  bootReadinessIsOrdered,
  circleIntersectsRectangle,
  displayWindowPolicy,
  millimetresToPixels,
  transitionPowerState,
  updateSimulatedBrightness,
  type DisplayDescriptor,
} from "../src/prototype.js";

const displays: readonly DisplayDescriptor[] = [
  {
    index: 0,
    connector: "DP-1",
    identifier: "driver-panel",
    edidId: "edid-driver",
    width: 2560,
    height: 720,
    refreshHz: 60,
    densityPpi: 170,
    physicalWidthMm: 600,
    physicalHeightMm: 170,
    x: 0,
    y: 0,
  },
  {
    index: 1,
    connector: "HDMI-A-1",
    identifier: "cabin-panel",
    edidId: "edid-cabin",
    width: 1920,
    height: 1080,
    refreshHz: 60,
    densityPpi: 160,
    physicalWidthMm: 345,
    physicalHeightMm: 194,
    x: 2560,
    y: 0,
  },
];

describe("prototype configuration", () => {
  it("assigns distinct roles deterministically", () => {
    const result = assignDisplayRoles(
      displays,
      {
        driver: { connector: "DP-1" },
        cabin: { edidId: "edid-cabin" },
      },
      false,
    );
    expect(result.errors).toEqual([]);
    expect(
      result.assignments.map((assignment) => assignment.display.index),
    ).toEqual([0, 1]);
  });

  it("fails safely when a display is missing", () => {
    const result = assignDisplayRoles(
      displays.slice(0, 1),
      {
        driver: { connector: "DP-1" },
        cabin: { connector: "HDMI-A-1" },
      },
      false,
    );
    expect(result.assignments).toEqual([]);
    expect(result.errors[0]).toContain("cabin display is missing");
  });

  it("allows fallback only when explicit and rejects role swapping", () => {
    const withoutFallback = assignDisplayRoles(
      displays,
      { driver: { connector: "missing" }, cabin: { connector: "HDMI-A-1" } },
      false,
    );
    expect(withoutFallback.errors).not.toEqual([]);
    const withFallback = assignDisplayRoles(
      displays,
      { driver: { connector: "missing" }, cabin: { connector: "HDMI-A-1" } },
      true,
    );
    expect(withFallback.errors).toEqual([]);
    expect(withFallback.assignments[0]?.reason).toBe(
      "explicit-development-fallback",
    );
  });

  it("recovers the same roles after a simulated display hot-plug", () => {
    const selectors = {
      driver: { identifier: "driver-panel" },
      cabin: { identifier: "cabin-panel" },
    };
    expect(
      assignDisplayRoles(displays.slice(0, 1), selectors, false).errors,
    ).not.toEqual([]);
    expect(
      assignDisplayRoles(displays, selectors, false).assignments.map(
        ({ display }) => display.identifier,
      ),
    ).toEqual(["driver-panel", "cabin-panel"]);
  });

  it("converts measured millimetres and checks occlusion", () => {
    expect(millimetresToPixels(100, 500, 2000)).toBe(400);
    expect(
      circleIntersectsRectangle(
        { centreX: 500, centreY: 300, radius: 150 },
        { x: 450, y: 250, width: 100, height: 100 },
      ),
    ).toBe(true);
  });

  it("defines full-screen geometry and role-specific cursor policy", () => {
    expect(displayWindowPolicy("driver", "fullscreen", displays[0]!)).toEqual({
      fullscreen: true,
      borderless: true,
      cursor: "hidden",
      geometry: { x: 0, y: 0, width: 2560, height: 720 },
    });
    expect(
      displayWindowPolicy("cabin", "development", displays[1]!).cursor,
    ).toBe("touch-or-pointer");
  });

  it("isolates rotary actions from the driver display and wraps cabin focus", () => {
    const driver = {
      focusedDisplay: "driver" as const,
      focusIndex: 0,
      focusCount: 7,
      activatedIndex: null,
      requestedAction: null,
    };
    expect(applyRotaryAction(driver, "press")).toEqual(driver);
    const cabin = {
      ...driver,
      focusedDisplay: "cabin" as const,
      focusIndex: 6,
    };
    expect(applyRotaryAction(cabin, "rotate-clockwise").focusIndex).toBe(0);
    expect(applyRotaryAction(cabin, "rotate-anticlockwise").focusIndex).toBe(5);
  });

  it("applies brightness hysteresis without repeated switching", () => {
    const options = { lowLux: 80, highLux: 140, minimum: 0.2, maximum: 0.9 };
    const night = updateSimulatedBrightness(
      { theme: "night", brightness: 0.2 },
      100,
      options,
    );
    expect(night.theme).toBe("night");
    const day = updateSimulatedBrightness(night, 150, options);
    expect(day.theme).toBe("day");
    expect(updateSimulatedBrightness(day, 100, options).theme).toBe("day");
    expect(updateSimulatedBrightness(day, 70, options).theme).toBe("night");
  });

  it("validates simulated power and boot ordering", () => {
    expect(transitionPowerState("off", "accessory")).toBe("accessory");
    expect(() => transitionPowerState("off", "running")).toThrow();
    expect(
      bootReadinessIsOrdered({
        processStart: 0,
        windowVisible: 10,
        qmlReady: 20,
        essentialUiReady: 25,
        firstTelemetry: 100,
      }),
    ).toBe(true);
    expect(
      bootReadinessIsOrdered({
        processStart: 0,
        windowVisible: 30,
        qmlReady: 20,
        essentialUiReady: 40,
        firstTelemetry: 100,
      }),
    ).toBe(false);
  });
});
