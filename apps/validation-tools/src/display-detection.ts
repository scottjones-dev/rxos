import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { DisplayDescriptor } from "@rxos/config";

const execFileAsync = promisify(execFile);

function isDisplayDescriptor(value: unknown): value is DisplayDescriptor {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Readonly<Record<string, unknown>>;
  return (
    Number.isInteger(candidate.index) &&
    typeof candidate.connector === "string" &&
    typeof candidate.identifier === "string" &&
    Number.isInteger(candidate.width) &&
    Number.isInteger(candidate.height) &&
    Number.isFinite(candidate.x) &&
    Number.isFinite(candidate.y)
  );
}

export function parseDisplayInventory(
  value: unknown,
): readonly DisplayDescriptor[] {
  if (!Array.isArray(value) || !value.every(isDisplayDescriptor))
    throw new Error("Display inventory does not match the prototype contract");
  const identifiers = new Set(value.map((display) => display.identifier));
  if (identifiers.size !== value.length)
    throw new Error("Display inventory identifiers must be unique");
  return value;
}

export function parseXrandr(output: string): readonly DisplayDescriptor[] {
  const displays: DisplayDescriptor[] = [];
  let currentIndex = -1;
  for (const line of output.split(/\r?\n/u)) {
    const match =
      /^(\S+) connected(?: primary)? (\d+)x(\d+)\+(-?\d+)\+(-?\d+)(?:.*?(\d+)mm x (\d+)mm)?/u.exec(
        line,
      );
    if (!match) {
      const refresh = /(\d+(?:\.\d+)?)\*/u.exec(line);
      if (currentIndex >= 0 && refresh) {
        const current = displays[currentIndex];
        if (current)
          displays[currentIndex] = {
            ...current,
            refreshHz: Number(refresh[1]),
          };
      }
      continue;
    }
    const width = Number(match[2]);
    const height = Number(match[3]);
    const physicalWidthMm = match[6] ? Number(match[6]) : null;
    const physicalHeightMm = match[7] ? Number(match[7]) : null;
    const densityPpi =
      physicalWidthMm && physicalHeightMm
        ? Math.hypot(width, height) /
          (Math.hypot(physicalWidthMm, physicalHeightMm) / 25.4)
        : null;
    displays.push({
      index: displays.length,
      connector: match[1] as string,
      identifier: match[1] as string,
      width,
      height,
      refreshHz: null,
      densityPpi,
      physicalWidthMm,
      physicalHeightMm,
      x: Number(match[4]),
      y: Number(match[5]),
    });
    currentIndex = displays.length - 1;
  }
  return displays;
}

async function edidIdentifiers(): Promise<ReadonlyMap<string, string>> {
  const result = new Map<string, string>();
  if (process.platform !== "linux") return result;
  try {
    const entries = await readdir("/sys/class/drm", { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && entry.name.includes("-"))
        .map(async (entry) => {
          try {
            const status = (
              await readFile(`/sys/class/drm/${entry.name}/status`, "utf8")
            ).trim();
            if (status !== "connected") return;
            const edid = await readFile(`/sys/class/drm/${entry.name}/edid`);
            if (edid.length === 0) return;
            const connector = entry.name.replace(/^card\d+-/u, "");
            result.set(
              connector,
              createHash("sha256").update(edid).digest("hex").slice(0, 24),
            );
          } catch {
            // Missing EDID is expected for virtual displays and some adapters.
          }
        }),
    );
  } catch {
    // sysfs is an optional source.
  }
  return result;
}

export async function detectDisplays(
  inventoryPath?: string,
): Promise<readonly DisplayDescriptor[]> {
  if (inventoryPath)
    return parseDisplayInventory(
      JSON.parse(await readFile(inventoryPath, "utf8")) as unknown,
    );
  if (process.platform !== "linux")
    throw new Error(
      "Automatic display detection is currently Linux-only; provide --inventory",
    );
  let xrandrOutput: string;
  try {
    ({ stdout: xrandrOutput } = await execFileAsync("xrandr", ["--query"], {
      encoding: "utf8",
    }));
  } catch {
    throw new Error(
      "No display inventory was supplied and xrandr detection failed",
    );
  }
  const edids = await edidIdentifiers();
  return parseXrandr(xrandrOutput).map((display) => ({
    ...display,
    edidId: edids.get(display.connector),
    identifier: edids.get(display.connector) ?? display.connector,
  }));
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const valueAfter = (name: string): string | undefined => {
    const index = arguments_.indexOf(name);
    return index >= 0 ? arguments_[index + 1] : undefined;
  };
  const displays = await detectDisplays(valueAfter("--inventory"));
  const report = {
    component: "display-detection",
    event: "inventory",
    displayServer:
      process.env.XDG_SESSION_TYPE ??
      (process.env.WAYLAND_DISPLAY
        ? "wayland"
        : process.env.DISPLAY
          ? "x11"
          : "unknown"),
    displays,
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const output = valueAfter("--output");
  if (output) await writeFile(output, serialized);
  process.stdout.write(serialized);
}

if (process.argv[1]?.endsWith("display-detection.js")) await main();
