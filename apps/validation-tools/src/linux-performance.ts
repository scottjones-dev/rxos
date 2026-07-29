import { execFileSync, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { qtEnvironment, terminate } from "./process.js";

interface NativeLog {
  readonly component?: string;
  readonly event?: string;
  readonly [key: string]: unknown;
}

interface ProcessSample {
  readonly elapsedMs: number;
  readonly phase: "idle" | "sustained";
  readonly driverRssKb: number | null;
  readonly cabinRssKb: number | null;
  readonly driverCpuPercent: number | null;
  readonly cabinCpuPercent: number | null;
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

function executable(display: "driver" | "cabin"): string {
  const suffix = process.platform === "win32" ? ".exe" : "";
  const override =
    display === "driver"
      ? process.env.RXOS_DRIVER_EXECUTABLE
      : process.env.RXOS_CABIN_EXECUTABLE;
  return (
    override ??
    resolve(
      "build/native/apps",
      `${display}-display`,
      `rxos-${display}-display${suffix}`,
    )
  );
}

async function processMetrics(
  child: ChildProcess,
): Promise<{ rssKb: number | null; ticks: number | null }> {
  if (process.platform !== "linux" || child.pid === undefined)
    return { rssKb: null, ticks: null };
  const [status, stat] = await Promise.all([
    readFile(`/proc/${child.pid}/status`, "utf8"),
    readFile(`/proc/${child.pid}/stat`, "utf8"),
  ]);
  const memoryMatch = /^VmRSS:\s+(\d+)\s+kB$/m.exec(status);
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  return {
    rssKb: memoryMatch ? Number(memoryMatch[1]) : null,
    ticks: Number(fields[11]) + Number(fields[12]),
  };
}

function collectLogs(child: ChildProcess, output: NativeLog[]): void {
  const parse = (data: Buffer): void => {
    for (const line of data.toString().split(/\r?\n/u)) {
      const start = line.indexOf("{");
      if (start < 0) continue;
      try {
        const candidate: unknown = JSON.parse(line.slice(start));
        if (candidate && typeof candidate === "object")
          output.push(candidate as NativeLog);
      } catch {
        // Qt may prefix or combine diagnostic lines; non-JSON output is ignored.
      }
    }
  };
  child.stdout?.on("data", parse);
  child.stderr?.on("data", parse);
}

function startSimulator(
  port: number,
  hz: number,
): {
  child: ChildProcess;
  ready: Promise<void>;
} {
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
  const ready = new Promise<void>((resolveStartup, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Simulator ${hz} Hz startup timed out`)),
      5_000,
    );
    child.once("error", reject);
    child.stdout?.on("data", (data: Buffer) => {
      if (data.toString().includes('"event":"startup"')) {
        clearTimeout(timeout);
        resolveStartup();
      }
    });
  });
  return { child, ready };
}

const durationSeconds = Number(process.argv[2] ?? 8);
const clockTicksPerSecond =
  process.platform === "linux"
    ? Number(execFileSync("getconf", ["CLK_TCK"], { encoding: "utf8" }).trim())
    : null;
const output = resolve(
  process.argv[3] ?? "build/performance/native-short.json",
);
const port = await availablePort();
const endpoint = `ws://127.0.0.1:${port}/telemetry`;
let simulator = startSimulator(port, 1);
await simulator.ready;
const nativeLogs: NativeLog[] = [];
const driver = spawn(executable("driver"), ["--telemetry-endpoint", endpoint], {
  env: qtEnvironment,
  stdio: ["ignore", "pipe", "pipe"],
});
const cabin = spawn(executable("cabin"), ["--telemetry-endpoint", endpoint], {
  env: qtEnvironment,
  stdio: ["ignore", "pipe", "pipe"],
});
collectLogs(driver, nativeLogs);
collectLogs(cabin, nativeLogs);
const samples: ProcessSample[] = [];
const started = Date.now();
let previousTime = Date.now();
let previousDriverTicks: number | null = null;
let previousCabinTicks: number | null = null;

async function sample(phase: "idle" | "sustained"): Promise<void> {
  const now = Date.now();
  const elapsedSeconds = Math.max(0.001, (now - previousTime) / 1_000);
  const [driverMetrics, cabinMetrics] = await Promise.all([
    processMetrics(driver),
    processMetrics(cabin),
  ]);
  const cpu = (ticks: number | null, previous: number | null): number | null =>
    ticks === null || previous === null
      ? null
      : clockTicksPerSecond === null
        ? null
        : ((ticks - previous) / clockTicksPerSecond / elapsedSeconds) * 100;
  samples.push({
    elapsedMs: now - started,
    phase,
    driverRssKb: driverMetrics.rssKb,
    cabinRssKb: cabinMetrics.rssKb,
    driverCpuPercent: cpu(driverMetrics.ticks, previousDriverTicks),
    cabinCpuPercent: cpu(cabinMetrics.ticks, previousCabinTicks),
  });
  previousTime = now;
  previousDriverTicks = driverMetrics.ticks;
  previousCabinTicks = cabinMetrics.ticks;
}

try {
  const phaseSeconds = Math.max(2, Math.floor(durationSeconds / 2));
  for (let second = 0; second < phaseSeconds; second += 1) {
    await sample("idle");
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  }
  await terminate(simulator.child);
  simulator = startSimulator(port, 60);
  await simulator.ready;
  for (let second = 0; second < phaseSeconds; second += 1) {
    await sample("sustained");
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  }
} finally {
  const shutdownStarted = Date.now();
  await Promise.all([
    terminate(driver),
    terminate(cabin),
    terminate(simulator.child),
  ]);
  nativeLogs.push({
    component: "native-performance",
    event: "shutdown_observation",
    shutdownMs: Date.now() - shutdownStarted,
  });
}
await mkdir(resolve(output, ".."), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      component: "native-performance",
      durationSeconds,
      phases: { idleHz: 1, sustainedHz: 60 },
      platform: process.platform,
      renderingBackend: qtEnvironment.QSG_RHI_BACKEND,
      screenProfiles: {
        driver: "2560x720",
        cabin: "1920x1080",
      },
      samples,
      nativeLogs,
      limitations: [
        "CPU is sampled from Linux process ticks and remains host-sensitive.",
        "Offscreen software rendering is not target-hardware performance.",
      ],
    },
    null,
    2,
  )}\n`,
);
