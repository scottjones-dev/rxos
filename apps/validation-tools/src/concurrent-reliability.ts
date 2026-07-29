import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import { simulatedEnvelope } from "@rxos/telemetry-fixtures";
import { qtEnvironment, terminate } from "./process.js";

function executable(display: "driver" | "cabin"): string {
  const suffix = process.platform === "win32" ? ".exe" : "";
  const variable =
    display === "driver"
      ? process.env.RXOS_DRIVER_EXECUTABLE
      : process.env.RXOS_CABIN_EXECUTABLE;
  return (
    variable ??
    resolve(
      "build/native/apps",
      `${display}-display`,
      `rxos-${display}-display${suffix}`,
    )
  );
}

function waitForConnection(server: WebSocketServer): Promise<WebSocket> {
  return new Promise((resolveConnection, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Display connection timed out")),
      8_000,
    );
    server.once("connection", (client) => {
      clearTimeout(timeout);
      resolveConnection(client);
    });
  });
}

function waitForExit(child: ChildProcess, name: string): Promise<void> {
  return new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolveExit()
        : reject(new Error(`${name} exited with ${code ?? "no code"}`)),
    );
  });
}

function launch(
  display: "driver" | "cabin",
  endpoint: string,
  args: readonly string[],
): ChildProcess {
  const child = spawn(
    executable(display),
    ["--telemetry-endpoint", endpoint, ...args],
    { env: qtEnvironment, stdio: ["ignore", "pipe", "pipe"] },
  );
  child.stdout?.on("data", (data: Buffer) =>
    process.stdout.write(`[${display}] ${data.toString()}`),
  );
  child.stderr?.on("data", (data: Buffer) =>
    process.stderr.write(`[${display}] ${data.toString()}`),
  );
  return child;
}

const server = new WebSocketServer({
  host: "127.0.0.1",
  port: 0,
  path: "/telemetry",
});
await new Promise<void>((resolveListen, reject) => {
  server.once("listening", resolveListen);
  server.once("error", reject);
});
const address = server.address();
if (typeof address !== "object" || address === null)
  throw new Error("Failed to allocate telemetry port");
const endpoint = `ws://127.0.0.1:${address.port}/telemetry`;

let driver: ChildProcess | undefined;
let cabin: ChildProcess | undefined;
let timer: NodeJS.Timeout | undefined;
try {
  driver = launch("driver", endpoint, [
    "--accept-every",
    "4",
    "--exit-after",
    "8",
  ]);
  await waitForConnection(server);
  cabin = launch("cabin", endpoint, ["--exit-after", "30"]);
  const firstCabinConnection = await waitForConnection(server);

  let sequence = 0;
  timer = setInterval(() => {
    const payload = JSON.stringify(
      simulatedEnvelope(sequence / 60, sequence, new Date().toISOString()),
    );
    for (const client of server.clients)
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    sequence += 1;
    if (sequence === 10) firstCabinConnection.close(1012, "reconnect test");
  }, 1000 / 60);

  let scenarioTimeout: NodeJS.Timeout | undefined;
  await Promise.race([
    Promise.all([
      waitForExit(driver, "driver display"),
      waitForExit(cabin, "cabin display"),
    ]),
    new Promise<never>((_, reject) => {
      scenarioTimeout = setTimeout(
        () => reject(new Error("Concurrent display scenario timed out")),
        15_000,
      );
    }),
  ]);
  if (scenarioTimeout) clearTimeout(scenarioTimeout);
  if (sequence < 30)
    throw new Error(`Insufficient concurrent telemetry: ${sequence} frames`);
  console.log(
    JSON.stringify({
      component: "concurrent-reliability",
      event: "scenario_finish",
      sequence,
    }),
  );
} finally {
  if (timer) clearInterval(timer);
  if (driver) await terminate(driver);
  if (cabin) await terminate(cabin);
  for (const client of server.clients) client.terminate();
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
}
