import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";

export const qtEnvironment = {
  ...process.env,
  QT_QPA_PLATFORM: process.env.QT_QPA_PLATFORM ?? "offscreen",
  QSG_RHI_BACKEND: process.env.QSG_RHI_BACKEND ?? "software",
};

export function run(
  executable: string,
  args: readonly string[],
  prefix: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      env: qtEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (data: Buffer) =>
      process.stdout.write(`[${prefix}] ${data.toString()}`),
    );
    child.stderr?.on("data", (data: Buffer) =>
      process.stderr.write(`[${prefix}] ${data.toString()}`),
    );
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${prefix} exited with ${code ?? "no code"}`)),
    );
  });
}

export async function terminate(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}
