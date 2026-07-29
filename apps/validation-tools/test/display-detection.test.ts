import { describe, expect, it } from "vitest";
import {
  parseDisplayInventory,
  parseXrandr,
} from "../src/display-detection.js";

describe("display detection", () => {
  it("parses multiple virtual monitor geometries", () => {
    const displays = parseXrandr(
      "DP-1 connected primary 2560x720+0+0 600mm x 170mm\n" +
        "   2560x720 60.00*+\n" +
        "HDMI-1 connected 1920x1080+2560+0 345mm x 194mm\n" +
        "   1920x1080 59.94*+\n",
    );
    expect(displays).toHaveLength(2);
    expect(displays[1]).toMatchObject({
      connector: "HDMI-1",
      width: 1920,
      height: 1080,
      x: 2560,
      refreshHz: 59.94,
    });
  });

  it("rejects duplicate identifiers", () => {
    const display = {
      index: 0,
      connector: "DP-1",
      identifier: "same",
      width: 1920,
      height: 720,
      x: 0,
      y: 0,
    };
    expect(() =>
      parseDisplayInventory([display, { ...display, index: 1 }]),
    ).toThrow("identifiers must be unique");
  });
});
