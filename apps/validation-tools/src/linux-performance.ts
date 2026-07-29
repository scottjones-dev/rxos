import { execFileSync, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { arch, cpus, platform, release } from "node:os";
import { resolve } from "node:path";
import { qtEnvironment, terminate } from "./process.js";

type Display = "driver" | "cabin";
type Topology = "simulator" | Display | "concurrent";

interface NativeLog {
  readonly component?: string;
  readonly event?: string;
  readonly [key: string]: unknown;
}

interface RawProcessMetrics {
  readonly rssKb: number | null;
  readonly pssKb: number | null;
  readonly virtualKb: number | null;
  readonly privateDirtyKb: number | null;
  readonly threads: number | null;
  readonly fileDescriptors: number | null;
  readonly ticks: number | null;
}

interface ProcessSample extends Omit<RawProcessMetrics, "ticks"> {
  readonly cpuPercent: number | null;
}

interface Sample {
  readonly elapsedMs: number;
  readonly processes: Readonly<Record<string, ProcessSample>>;
}

interface Options {
  readonly durationSeconds: number;
  readonly output: string;
  readonly topology: Topology;
  readonly rates: readonly number[];
  readonly scenario: string;
  readonly buildType: "Debug" | "Release";
}

function valueAfter(
  arguments_: readonly string[],
  name: string,
): string | undefined {
  const index = arguments_.indexOf(name);
  return index >= 0 ? arguments_[index + 1] : undefined;
}

export function parseOptions(arguments_: readonly string[]): Options {
  // Positional duration/output remain compatible with milestone 1.3 commands.
  const positionalDuration =
    arguments_[0] && !arguments_[0].startsWith("--")
      ? arguments_[0]
      : undefined;
  const positionalOutput =
    arguments_[1] && !arguments_[1].startsWith("--")
      ? arguments_[1]
      : undefined;
  const durationSeconds = Number(
    valueAfter(arguments_, "--duration") ?? positionalDuration ?? 60,
  );
  const output = resolve(
    valueAfter(arguments_, "--output") ??
      positionalOutput ??
      "build/performance/native-short.json",
  );
  const topology = (valueAfter(arguments_, "--topology") ??
    "concurrent") as Topology;
  const rates = (valueAfter(arguments_, "--rates") ?? "60")
    .split(",")
    .map(Number);
  const scenario = valueAfter(arguments_, "--scenario") ?? "default";
  const buildType = (valueAfter(arguments_, "--build-type") ??
    "Release") as Options["buildType"];
  if (!Number.isInteger(durationSeconds) || durationSeconds < 2)
    throw new Error("--duration must be an integer of at least two seconds");
  if (!["simulator", "driver", "cabin", "concurrent"].includes(topology))
    throw new Error(
      "--topology must be simulator, driver, cabin or concurrent",
    );
  if (
    rates.length === 0 ||
    rates.some(
      (rate) => !Number.isInteger(rate) || ![1, 10, 20, 30, 60].includes(rate),
    )
  )
    throw new Error("--rates must contain only 1,10,20,30,60");
  if (!["Debug", "Release"].includes(buildType))
    throw new Error("--build-type must be Debug or Release");
  return {
    durationSeconds,
    output,
    topology,
    rates,
    scenario,
    buildType,
  };
}

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (typeof address !== "object" || address === null)
    throw new Error("Could not allocate a port");
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  return address.port;
}

function executable(display: Display, buildType: Options["buildType"]): string {
  const suffix = process.platform === "win32" ? ".exe" : "";
  const override =
    display === "driver"
      ? process.env.RXOS_DRIVER_EXECUTABLE
      : process.env.RXOS_CABIN_EXECUTABLE;
  const buildDirectory = buildType === "Release" ? "release" : "native";
  return (
    override ??
    resolve(
      `build/${buildDirectory}/apps`,
      `${display}-display`,
      `rxos-${display}-display${suffix}`,
    )
  );
}

function statusNumber(status: string, field: string): number | null {
  const match = new RegExp(`^${field}:\\s+(\\d+)(?:\\s+kB)?$`, "mu").exec(
    status,
  );
  return match ? Number(match[1]) : null;
}

async function processMetrics(child: ChildProcess): Promise<RawProcessMetrics> {
  if (process.platform !== "linux" || child.pid === undefined)
    return {
      rssKb: null,
      pssKb: null,
      virtualKb: null,
      privateDirtyKb: null,
      threads: null,
      fileDescriptors: null,
      ticks: null,
    };
  try {
    const [status, stat, smaps, descriptors] = await Promise.all([
      readFile(`/proc/${child.pid}/status`, "utf8"),
      readFile(`/proc/${child.pid}/stat`, "utf8"),
      readFile(`/proc/${child.pid}/smaps_rollup`, "utf8").catch(() => ""),
      readdir(`/proc/${child.pid}/fd`).catch(() => []),
    ]);
    const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    return {
      rssKb: statusNumber(status, "VmRSS"),
      pssKb: statusNumber(smaps, "Pss"),
      virtualKb: statusNumber(status, "VmSize"),
      privateDirtyKb: statusNumber(smaps, "Private_Dirty"),
      threads: statusNumber(status, "Threads"),
      fileDescriptors: descriptors.length,
      ticks: Number(fields[11]) + Number(fields[12]),
    };
  } catch {
    return {
      rssKb: null,
      pssKb: null,
      virtualKb: null,
      privateDirtyKb: null,
      threads: null,
      fileDescriptors: null,
      ticks: null,
    };
  }
}

function collectLogs(child: ChildProcess, output: NativeLog[]): void {
  const attach = (stream: NodeJS.ReadableStream | null): void => {
    let pending = "";
    stream?.on("data", (data: Buffer) => {
      pending += data.toString();
      const lines = pending.split(/\r?\n/u);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const start = line.indexOf("{");
        if (start < 0) continue;
        try {
          const candidate: unknown = JSON.parse(line.slice(start));
          if (candidate && typeof candidate === "object")
            output.push(candidate as NativeLog);
        } catch {
          // Qt diagnostics may be non-JSON. Only structured records are retained.
        }
      }
    });
  };
  attach(child.stdout);
  attach(child.stderr);
}

function startSimulator(
  port: number,
  hz: number,
  logs: NativeLog[],
): { child: ChildProcess; ready: Promise<void> } {
  const child = spawn(
    process.execPath,
    [
      resolve("apps/vehicle-simulator/dist/src/main.js"),
      "--port",
      String(port),
      "--hz",
      String(hz),
    ],
    { env: process.env, stdio: ["ignore", "pipe", "pipe"] },
  );
  collectLogs(child, logs);
  const ready = new Promise<void>((resolveStartup, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Simulator ${hz} Hz startup timed out`)),
      5_000,
    );
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Simulator ${hz} Hz exited before startup with ${code ?? "no code"}`,
        ),
      );
    });
    child.stdout?.on("data", (data: Buffer) => {
      if (data.toString().includes('"event":"startup"')) {
        clearTimeout(timeout);
        resolveStartup();
      }
    });
  });
  return { child, ready };
}

function displaysFor(topology: Topology): readonly Display[] {
  if (topology === "concurrent") return ["driver", "cabin"];
  if (topology === "driver" || topology === "cabin") return [topology];
  return [];
}

function defaultScenario(display: Display, requested: string): string {
  if (requested !== "default") return requested;
  return display === "driver" ? "daily" : "home";
}

function slopePerMinute(
  samples: readonly Sample[],
  processName: string,
  metric: keyof ProcessSample,
): number | null {
  const latter = samples.slice(Math.floor(samples.length / 2));
  const points = latter
    .map((sample) => ({
      x: sample.elapsedMs / 60_000,
      y: sample.processes[processName]?.[metric],
    }))
    .filter(
      (point): point is { x: number; y: number } => typeof point.y === "number",
    );
  if (points.length < 3) return null;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const numerator = points.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + (point.x - meanX) ** 2,
    0,
  );
  return denominator === 0 ? 0 : numerator / denominator;
}

function classifyMemory(
  samples: readonly Sample[],
  processName: string,
  durationSeconds: number,
): Readonly<Record<string, unknown>> {
  const rssSlopeKbPerMinute = slopePerMinute(samples, processName, "rssKb");
  const privateDirtySlopeKbPerMinute = slopePerMinute(
    samples,
    processName,
    "privateDirtyKb",
  );
  let classification = "insufficient evidence";
  if (
    durationSeconds >= 600 &&
    rssSlopeKbPerMinute !== null &&
    privateDirtySlopeKbPerMinute !== null
  ) {
    if (rssSlopeKbPerMinute > 2_048 && privateDirtySlopeKbPerMinute > 1_024)
      classification = "leak-like";
    else if (rssSlopeKbPerMinute > 1_024 || privateDirtySlopeKbPerMinute > 512)
      classification = "slow growth";
    else classification = "bounded warm-up";
  }
  return {
    classification,
    rssSlopeKbPerMinute,
    privateDirtySlopeKbPerMinute,
    reason:
      durationSeconds < 600
        ? "A standard observation of at least 600 seconds is required."
        : undefined,
  };
}

async function runRate(options: Options, hz: number): Promise<unknown> {
  const port = await availablePort();
  const endpoint = `ws://127.0.0.1:${port}/telemetry`;
  const nativeLogs: NativeLog[] = [];
  const simulator = startSimulator(port, hz, nativeLogs);
  await simulator.ready;
  const children: Record<string, ChildProcess> = { simulator: simulator.child };
  for (const display of displaysFor(options.topology)) {
    const child = spawn(
      executable(display, options.buildType),
      [
        "--telemetry-endpoint",
        endpoint,
        "--source-hz",
        String(hz),
        "--profile-scenario",
        defaultScenario(display, options.scenario),
      ],
      { env: qtEnvironment, stdio: ["ignore", "pipe", "pipe"] },
    );
    collectLogs(child, nativeLogs);
    children[display] = child;
  }

  const samples: Sample[] = [];
  const previousTicks = new Map<string, number>();
  let previousTime = Date.now();
  const started = previousTime;
  try {
    for (let second = 0; second < options.durationSeconds; second += 1) {
      const now = Date.now();
      const elapsedSeconds = Math.max(0.001, (now - previousTime) / 1_000);
      const entries = await Promise.all(
        Object.entries(children).map(async ([name, child]) => {
          const metrics = await processMetrics(child);
          const previous = previousTicks.get(name);
          const cpuPercent =
            metrics.ticks === null ||
            previous === undefined ||
            clockTicksPerSecond === null
              ? null
              : ((metrics.ticks - previous) /
                  clockTicksPerSecond /
                  elapsedSeconds) *
                100;
          if (metrics.ticks !== null) previousTicks.set(name, metrics.ticks);
          return [
            name,
            {
              rssKb: metrics.rssKb,
              pssKb: metrics.pssKb,
              virtualKb: metrics.virtualKb,
              privateDirtyKb: metrics.privateDirtyKb,
              threads: metrics.threads,
              fileDescriptors: metrics.fileDescriptors,
              cpuPercent,
            },
          ] as const;
        }),
      );
      samples.push({
        elapsedMs: now - started,
        processes: Object.fromEntries(entries),
      });
      previousTime = now;
      await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
    }
  } finally {
    const shutdownStarted = Date.now();
    await Promise.all(Object.values(children).map(terminate));
    nativeLogs.push({
      component: "native-performance",
      event: "shutdown_observation",
      shutdownMs: Date.now() - shutdownStarted,
    });
  }
  return {
    hz,
    topology: options.topology,
    scenario: options.scenario,
    durationSeconds: options.durationSeconds,
    samples,
    memoryAnalysis: Object.fromEntries(
      Object.keys(children).map((name) => [
        name,
        classifyMemory(samples, name, options.durationSeconds),
      ]),
    ),
    nativeLogs,
  };
}

const options = parseOptions(process.argv.slice(2));
const clockTicksPerSecond =
  process.platform === "linux"
    ? Number(execFileSync("getconf", ["CLK_TCK"], { encoding: "utf8" }).trim())
    : null;
const runs = [];
for (const rate of options.rates) runs.push(await runRate(options, rate));
await mkdir(resolve(options.output, ".."), { recursive: true });
await writeFile(
  options.output,
  `${JSON.stringify(
    {
      schemaVersion: 2,
      component: "native-performance",
      environment: {
        platform: platform(),
        release: release(),
        architecture: arch(),
        logicalCpuCount: cpus().length,
        buildType: options.buildType,
        qtPlatform: qtEnvironment.QT_QPA_PLATFORM,
        renderingBackend: qtEnvironment.QSG_RHI_BACKEND,
        screenProfiles: {
          driver: "2560x720",
          cabin: "1920x1080",
        },
      },
      metricSupport: {
        rss:
          process.platform === "linux"
            ? "supported"
            : "unsupported: Linux procfs required",
        pss:
          process.platform === "linux"
            ? "attempted: null means smaps_rollup unavailable"
            : "unsupported: Linux procfs required",
        virtualMemory:
          process.platform === "linux"
            ? "supported"
            : "unsupported: Linux procfs required",
        privateDirty:
          process.platform === "linux"
            ? "attempted: null means smaps_rollup unavailable"
            : "unsupported: Linux procfs required",
        cpu:
          clockTicksPerSecond === null
            ? "unsupported: Linux process ticks required"
            : "supported",
        threads:
          process.platform === "linux"
            ? "supported"
            : "unsupported: Linux procfs required",
        fileDescriptors:
          process.platform === "linux"
            ? "attempted: null means procfs fd access unavailable"
            : "unsupported: Linux procfs required",
      },
      options,
      runs,
      limitations: [
        "CPU and memory are host-sensitive observations.",
        "Offscreen software rendering is not target-hardware performance.",
        "Frame swaps are application events, not panel scan-out measurements.",
      ],
    },
    null,
    2,
  )}\n`,
);
