import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { qtEnvironment, terminate } from "./process.js";

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (typeof address !== "object" || address === null)
    throw new Error("Could not allocate a local port");
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  return address.port;
}

function nativeExecutable(display: "driver" | "cabin"): string {
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

function pipe(child: ChildProcess, name: string): void {
  child.stdout?.on("data", (data: Buffer) =>
    process.stdout.write(`[${name}] ${data.toString()}`),
  );
  child.stderr?.on("data", (data: Buffer) =>
    process.stderr.write(`[${name}] ${data.toString()}`),
  );
}

function waitForStartup(child: ChildProcess): Promise<void> {
  return new Promise((resolveStartup, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Simulator startup timed out")),
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
}

const explicitPort = Number(process.argv[2] ?? 0);
const port = explicitPort > 0 ? explicitPort : await availablePort();
const endpoint = `ws://127.0.0.1:${port}/telemetry`;
const simulator = spawn(
  process.execPath,
  [resolve("apps/vehicle-simulator/dist/src/main.js"), "--port", String(port)],
  { env: process.env, stdio: ["ignore", "pipe", "pipe"] },
);
pipe(simulator, "simulator");
await waitForStartup(simulator);
const driver = spawn(
  nativeExecutable("driver"),
  ["--telemetry-endpoint", endpoint],
  { env: qtEnvironment, stdio: ["ignore", "pipe", "pipe"] },
);
const cabin = spawn(
  nativeExecutable("cabin"),
  ["--telemetry-endpoint", endpoint],
  { env: qtEnvironment, stdio: ["ignore", "pipe", "pipe"] },
);
pipe(driver, "driver");
pipe(cabin, "cabin");

console.log(
  JSON.stringify({
    component: "dual-display-launcher",
    event: "startup",
    endpoint,
  }),
);
let stopping = false;
async function stop(): Promise<void> {
  if (stopping) return;
  stopping = true;
  await Promise.all([
    terminate(driver),
    terminate(cabin),
    terminate(simulator),
  ]);
  console.log(
    JSON.stringify({
      component: "dual-display-launcher",
      event: "graceful_shutdown",
    }),
  );
}
process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
await Promise.race([
  new Promise<void>((resolveExit) => driver.once("exit", () => resolveExit())),
  new Promise<void>((resolveExit) => cabin.once("exit", () => resolveExit())),
  new Promise<void>((resolveExit) =>
    simulator.once("exit", () => resolveExit()),
  ),
]);
await stop();
