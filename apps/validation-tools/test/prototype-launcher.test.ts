import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createLaunchPlan,
  type LaunchOptions,
} from "../src/prototype-launcher.js";

function options(inventory: string): LaunchOptions {
  return {
    profilePath: resolve(
      "../../hardware/displays/profiles/development-desktop.json",
    ),
    inventoryPath: resolve(`../../hardware/displays/fixtures/${inventory}`),
    outputDirectory: "build/test-prototype",
    allowDevelopmentFallback: false,
    validateOnly: true,
  };
}

describe("prototype launcher plan", () => {
  it("assigns both virtual monitors without swapping roles", async () => {
    const plan = await createLaunchPlan(options("virtual-dual.json"));
    expect(plan.assignments.map(({ role }) => role)).toEqual([
      "driver",
      "cabin",
    ]);
    expect(
      new Set(plan.assignments.map(({ display }) => display.identifier)).size,
    ).toBe(2);
  });

  it("fails cleanly when the cabin monitor is absent", async () => {
    await expect(
      createLaunchPlan(options("virtual-driver-only.json")),
    ).rejects.toThrow("Display assignment failed");
  });
});
