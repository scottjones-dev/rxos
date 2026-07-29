import { describe, expect, it } from "vitest";
import { minimumTouchTarget, warningPriority } from "../src/index.js";

describe("mobile tokens", () => {
  it("keeps touch targets accessible", () =>
    expect(minimumTouchTarget).toBeGreaterThanOrEqual(48));
  it("prioritises simulator warnings", () => {
    expect(warningPriority("lowOilPressure")).toBe("critical");
    expect(warningPriority("lowFuel")).toBe("warning");
    expect(warningPriority("unsupported")).toBe("info");
  });
});
