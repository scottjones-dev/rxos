import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import {
  contentStressScenarios,
  outputName,
  visualScenarios,
} from "../src/scenarios.js";

describe("visual scenarios", () => {
  it("has unique output names and covers both displays", () => {
    const names = visualScenarios.map(outputName);
    expect(new Set(names).size).toBe(names.length);
    expect(visualScenarios.some(({ display }) => display === "driver")).toBe(
      true,
    );
    expect(visualScenarios.some(({ display }) => display === "cabin")).toBe(
      true,
    );
  });

  it("covers every cabin application and pseudo-locales", () => {
    for (const page of [
      "home",
      "navigation",
      "media",
      "vehicle",
      "performance",
      "diagnostics",
      "settings",
    ])
      expect(
        visualScenarios.some(
          ({ display, name }) => display === "cabin" && name.includes(page),
        ),
      ).toBe(true);
    expect(
      visualScenarios.filter(({ locale }) => locale === "en-XA"),
    ).toHaveLength(2);
    expect(
      visualScenarios.filter(({ locale }) => locale === "ar-XB"),
    ).toHaveLength(2);
  });

  it("enumerates the deterministic content stress contract", () => {
    expect(contentStressScenarios).toHaveLength(21);
    expect(contentStressScenarios).toContain("variable-rate-1-10-20-60");
    expect(contentStressScenarios).toContain("malformed-between-valid");
  });

  it("has a correctly sized reviewed baseline for every scenario", () => {
    for (const scenario of visualScenarios) {
      const image = PNG.sync.read(
        readFileSync(
          resolve("../../tests/visual/baselines", outputName(scenario)),
        ),
      );
      expect(image.width).toBe(scenario.display === "driver" ? 2560 : 1920);
      expect(image.height).toBe(scenario.display === "driver" ? 720 : 1080);
    }
  });
});
