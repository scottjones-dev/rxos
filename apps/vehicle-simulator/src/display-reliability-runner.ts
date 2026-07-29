import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { WebSocket, WebSocketServer } from "ws";
import { simulatedEnvelope } from "@rxos/telemetry-fixtures";

function requiredExecutable(value: string | undefined): string {
  if (!value) {
    throw new Error("Usage: display-reliability-runner <display executable>");
  }
  return value;
}

const executable = requiredExecutable(process.argv[2]);
const PORT = 8787;

function log(
  event: string,
  context: Readonly<Record<string, unknown>> = {},
): void {
  console.log(
    JSON.stringify({
      component: "display-reliability-runner",
      event,
      ...context,
    }),
  );
}

function listen(server: WebSocketServer): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

function close(server: WebSocketServer): Promise<void> {
  for (const client of server.clients) client.close(1012, "scenario restart");
  return new Promise((resolve) => {
    const forceClose = setTimeout(() => {
      for (const client of server.clients) client.terminate();
    }, 250);
    server.close(() => {
      clearTimeout(forceClose);
      resolve();
    });
  });
}

async function runScenario(): Promise<void> {
  const firstServer = new WebSocketServer({ port: PORT, path: "/telemetry" });
  await listen(firstServer);
  log("scenario_start");

  const child: ChildProcess = spawn(executable, ["--reliability-test"], {
    env: {
      ...process.env,
      QT_QPA_PLATFORM: process.env.QT_QPA_PLATFORM ?? "offscreen",
      QSG_RHI_BACKEND: process.env.QSG_RHI_BACKEND ?? "software",
    },
    stdio: "inherit",
  });

  const firstConnection = new Promise<void>((resolve) => {
    firstServer.once("connection", (client) => {
      client.send(JSON.stringify(simulatedEnvelope(1, 0)));
      setTimeout(() => {
        const stale = simulatedEnvelope(
          2,
          1,
          new Date(Date.now() - 5_000).toISOString(),
        );
        if (client.readyState === WebSocket.OPEN)
          client.send(JSON.stringify(stale));
      }, 200);
      setTimeout(() => {
        if (client.readyState === WebSocket.OPEN) client.send("{malformed");
      }, 400);
      setTimeout(resolve, 700);
    });
  });

  await firstConnection;
  await close(firstServer);
  await new Promise((resolve) => setTimeout(resolve, 700));

  const secondServer = new WebSocketServer({ port: PORT, path: "/telemetry" });
  await listen(secondServer);
  secondServer.once("connection", (client) => {
    client.send(JSON.stringify(simulatedEnvelope(3, 2)));
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Display reliability scenario timed out"));
    }, 14_000);
    child.once("error", reject);
    child.once("exit", (code: number | null) => {
      clearTimeout(timeout);
      resolve(code ?? 1);
    });
  });
  await close(secondServer);

  if (exitCode !== 0) {
    throw new Error(
      `Display reliability test failed with exit code ${exitCode}`,
    );
  }
  log("scenario_finish");
}

await runScenario();
