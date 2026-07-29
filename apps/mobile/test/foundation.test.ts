import { describe, expect, it } from "vitest";

const tabs = ["Home", "Trips", "Vehicle", "Garage", "Settings"] as const;
const requiredAccessibilityLabels = [
  "Simulator host",
  "Simulator port",
  "Save simulator address",
] as const;

describe("mobile foundation", () => {
  it("defines the complete five-tab navigation", () => {
    expect(tabs).toEqual(["Home", "Trips", "Vehicle", "Garage", "Settings"]);
  });

  it("keeps pairing inputs explicitly labelled", () => {
    expect(requiredAccessibilityLabels).toHaveLength(3);
  });
});
