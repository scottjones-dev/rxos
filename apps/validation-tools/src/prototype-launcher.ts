import { execFile, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { promisify } from "node:util";
import {
  assignDisplayRoles,
  type DisplayRole,
  type PrototypeMode,
  type PrototypeProfile,
  type RoleAssignment,
} from "@rxos/config";
import { detectDisplays } from "./display-detection.js";
import { qtEnvironment, terminate } from "./process.js";

const execFileAsync = promisify(execFile);

export interface LaunchOptions {
  readonly profilePath: string;
  readonly inventoryPath?: string;
  readonly outputDirectory: string;
  readonly mode?: PrototypeMode;
  readonly allowDevelopmentFallback: boolean;
  readonly validateOnly: boolean;
  readonly exitAfterSeconds?: number;
  readonly driverIdentifier?: string;
  readonly cabinIdentifier?: string;
}

export interface LaunchPlan {
  readonly profile: PrototypeProfile;
  readonly mode: PrototypeMode;
  readonly assignments: readonly RoleAssignment[];
}

function valueAfter(
  arguments_: readonly string[],
  name: string,
): string | undefined {
  const index = arguments_.indexOf(name);
  return index >= 0 ? arguments_[index + 1] : undefined;
}

function hasFlag(arguments_: readonly string[], name: string): boolean {
  return arguments_.includes(name);
}

function parseOptions(arguments_: readonly string[]): LaunchOptions {
  const exitAfter = valueAfter(arguments_, "--exit-after-seconds");
  const mode = valueAfter(arguments_, "--mode") as PrototypeMode | undefined;
  if (
    mode !== undefined &&
    !["development", "fullscreen", "physical-review", "performance"].includes(
      mode,
    )
  )
    throw new Error("Unsupported prototype mode");
  return {
    profilePath:
      valueAfter(arguments_, "--profile") ??
      "hardware/displays/profiles/development-desktop.json",
    inventoryPath: valueAfter(arguments_, "--inventory"),
    outputDirectory:
      valueAfter(arguments_, "--output") ?? "build/prototype-session",
    mode,
    allowDevelopmentFallback: hasFlag(
      arguments_,
      "--allow-development-fallback",
    ),
    validateOnly: hasFlag(arguments_, "--validate-only"),
    exitAfterSeconds:
      exitAfter === undefined ? undefined : Math.max(1, Number(exitAfter)),
    driverIdentifier: valueAfter(arguments_, "--driver-display"),
    cabinIdentifier: valueAfter(arguments_, "--cabin-display"),
  };
}

function parseProfile(value: unknown): PrototypeProfile {
  if (!value || typeof value !== "object")
    throw new Error("Prototype profile must be an object");
  const candidate = value as Readonly<Record<string, unknown>>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.name !== "string" ||
    !candidate.roles ||
    !candidate.displays
  )
    throw new Error("Prototype profile does not match schema version 1");
  return value as PrototypeProfile;
}

export async function createLaunchPlan(
  options: LaunchOptions,
): Promise<LaunchPlan> {
  const profile = parseProfile(
    JSON.parse(await readFile(resolve(options.profilePath), "utf8")) as unknown,
  );
  const displays = await detectDisplays(options.inventoryPath);
  const selectors = {
    driver: options.driverIdentifier
      ? { identifier: options.driverIdentifier }
      : profile.roles.driver,
    cabin: options.cabinIdentifier
      ? { identifier: options.cabinIdentifier }
      : profile.roles.cabin,
  };
  const allowFallback =
    (profile.allowDevelopmentFallback || options.allowDevelopmentFallback) &&
    (options.mode ?? profile.mode) === "development";
  const result = assignDisplayRoles(displays, selectors, allowFallback);
  if (result.errors.length > 0)
    throw new Error(`Display assignment failed: ${result.errors.join("; ")}`);
  const mode = options.mode ?? profile.mode;
  if (mode === "physical-review") {
    for (const role of ["driver", "cabin"] as const) {
      const dimensions = profile.displays[role];
      if (
        dimensions.physicalWidthMm === null ||
        dimensions.physicalHeightMm === null
      )
        throw new Error(
          `${role} physical dimensions are required for physical-review mode`,
        );
    }
  }
  return { profile, mode, assignments: result.assignments };
}

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (typeof address !== "object" || address === null)
    throw new Error("Could not allocate a loopback telemetry port");
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  return address.port;
}

function executable(role: DisplayRole): string {
  const override =
    role === "driver"
      ? process.env.RXOS_DRIVER_EXECUTABLE
      : process.env.RXOS_CABIN_EXECUTABLE;
  const suffix = process.platform === "win32" ? ".exe" : "";
  return (
    override ??
    resolve(
      "build/release/apps",
      `${role}-display`,
      `rxos-${role}-display${suffix}`,
    )
  );
}

function displayArguments(
  assignment: RoleAssignment,
  plan: LaunchPlan,
  endpoint: string,
  outputDirectory: string,
): readonly string[] {
  const physical = plan.profile.displays[assignment.role];
  const arguments_ = [
    "--telemetry-endpoint",
    endpoint,
    "--native-placement",
    "--screen-index",
    String(assignment.display.index),
    "--screen-id",
    assignment.display.identifier,
    "--screen-connector",
    assignment.display.connector,
    "--width",
    String(physical.widthPx),
    "--height",
    String(physical.heightPx),
    "--density",
    String(physical.densityPpi),
    "--capture",
    resolve(outputDirectory, `${assignment.role}-display.png`),
    "--capture-continue",
  ];
  if (plan.mode === "development") arguments_.push("--windowed");
  else arguments_.push("--fullscreen");
  if (plan.mode === "physical-review")
    arguments_.push(
      "--physical-review",
      "--physical-width-mm",
      String(physical.physicalWidthMm),
      "--physical-height-mm",
      String(physical.physicalHeightMm),
    );
  return arguments_;
}

function collect(
  child: ChildProcess,
  component: string,
  logs: string[],
  ready: Set<string>,
): void {
  const attach = (stream: NodeJS.ReadableStream | null): void => {
    let pending = "";
    stream?.on("data", (data: Buffer) => {
      pending += data.toString();
      const lines = pending.split(/\r?\n/u);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const prefixed = `[${component}] ${line}`;
        process.stdout.write(`${prefixed}\n`);
        logs.push(prefixed);
        if (logs.length > 2_000) logs.shift();
        if (line.includes('"event":"ui_ready"')) ready.add(component);
      }
    });
  };
  attach(child.stdout);
  attach(child.stderr);
}

async function waitForReadiness(
  ready: Set<string>,
  children: readonly ChildProcess[],
): Promise<void> {
  const started = Date.now();
  while (ready.size < 2) {
    if (children.some((child) => child.exitCode !== null))
      throw new Error("A display exited before both displays became ready");
    if (Date.now() - started > 15_000)
      throw new Error("Prototype display readiness timed out");
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
}

async function run(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const plan = await createLaunchPlan(options);
  await mkdir(resolve(options.outputDirectory), { recursive: true });
  await writeFile(
    resolve(options.outputDirectory, "assignment.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  if (options.validateOnly) {
    console.log(
      JSON.stringify({
        component: "prototype-launcher",
        event: "assignment_validated",
        mode: plan.mode,
        assignments: plan.assignments,
      }),
    );
    return;
  }

  const port = await availablePort();
  const endpoint = `ws://127.0.0.1:${port}/telemetry`;
  const logs: string[] = [];
  const ready = new Set<string>();
  const simulator = spawn(
    process.execPath,
    [
      resolve("apps/vehicle-simulator/dist/src/main.js"),
      "--port",
      String(port),
    ],
    { env: process.env, stdio: ["ignore", "pipe", "pipe"] },
  );
  collect(simulator, "simulator", logs, ready);
  await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  const displayChildren = plan.assignments.map((assignment) => {
    const child = spawn(
      executable(assignment.role),
      displayArguments(assignment, plan, endpoint, options.outputDirectory),
      { env: qtEnvironment, stdio: ["ignore", "pipe", "pipe"] },
    );
    collect(child, assignment.role, logs, ready);
    return child;
  });
  let stopTimer: NodeJS.Timeout | undefined;
  try {
    await waitForReadiness(ready, displayChildren);
    console.log(
      JSON.stringify({
        component: "prototype-launcher",
        event: "startup",
        mode: plan.mode,
        endpoint,
      }),
    );
    if (options.exitAfterSeconds)
      stopTimer = setTimeout(
        () => displayChildren[0]?.kill("SIGTERM"),
        options.exitAfterSeconds * 1_000,
      );
    await Promise.race(
      [simulator, ...displayChildren].map(
        (child) =>
          new Promise<void>((resolveExit, reject) => {
            child.once("error", reject);
            child.once("exit", () => resolveExit());
          }),
      ),
    );
  } finally {
    if (stopTimer) clearTimeout(stopTimer);
    await Promise.all(
      [simulator, ...displayChildren].map((child) => terminate(child)),
    );
    await writeFile(
      resolve(options.outputDirectory, "recent-logs.txt"),
      `${logs.join("\n")}\n`,
    );
    try {
      await execFileAsync(process.execPath, [
        resolve("apps/validation-tools/dist/src/prototype-diagnostics.js"),
        "--assignment",
        resolve(options.outputDirectory, "assignment.json"),
        `--log=${resolve(options.outputDirectory, "recent-logs.txt")}`,
        `--screenshot=${resolve(options.outputDirectory, "driver-display.png")}`,
        `--screenshot=${resolve(options.outputDirectory, "cabin-display.png")}`,
        "--output",
        resolve(options.outputDirectory, "diagnostics"),
      ]);
    } catch (error) {
      console.error(
        JSON.stringify({
          component: "prototype-launcher",
          event: "diagnostic_bundle_failed",
          message: error instanceof Error ? error.message : "unknown error",
        }),
      );
    }
    console.log(
      JSON.stringify({
        component: "prototype-launcher",
        event: "graceful_shutdown",
      }),
    );
  }
}

if (process.argv[1]?.endsWith("prototype-launcher.js")) await run();
