import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { basename, resolve } from "node:path";
import { promisify } from "node:util";
import {
  redactDiagnosticText,
  redactDiagnosticValue,
} from "./prototype-tools.js";

const execFileAsync = promisify(execFile);

async function command(
  name: string,
  arguments_: readonly string[],
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(name, arguments_, {
      encoding: "utf8",
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function optionalJson(path: string | undefined): Promise<unknown> {
  if (!path) return null;
  try {
    return JSON.parse(await readFile(resolve(path), "utf8")) as unknown;
  } catch {
    return null;
  }
}

async function run(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const valueAfter = (name: string): string | undefined => {
    const index = arguments_.indexOf(name);
    return index >= 0 ? arguments_[index + 1] : undefined;
  };
  const output = resolve(
    valueAfter("--output") ?? "build/prototype-diagnostics",
  );
  await mkdir(output, { recursive: true });
  const commit = (await command("git", ["rev-parse", "HEAD"])) ?? "unknown";
  const manifest = redactDiagnosticValue({
    schemaVersion: 1,
    component: "prototype-diagnostics",
    applicationVersion: "0.1.0",
    commit,
    generatedAt: new Date().toISOString(),
    environment: {
      platform: platform(),
      kernel: release(),
      architecture: arch(),
      logicalCpuCount: cpus().length,
      totalMemoryBytes: totalmem(),
      displayServer:
        process.env.XDG_SESSION_TYPE ??
        (process.env.WAYLAND_DISPLAY
          ? "wayland"
          : process.env.DISPLAY
            ? "x11"
            : "unknown"),
      qtPlatform: process.env.QT_QPA_PLATFORM ?? "default",
      renderingBackend: process.env.QSG_RHI_BACKEND ?? "default",
      gpu: await command("sh", [
        "-c",
        "lspci 2>/dev/null | grep -Ei 'vga|3d|display' | head -n 1",
      ]),
      graphicsDriver: await command("sh", [
        "-c",
        "glxinfo -B 2>/dev/null | grep -E 'OpenGL vendor|OpenGL renderer|OpenGL version' | tr '\\n' ';'",
      ]),
      qtVersion: await command("qmake", ["-query", "QT_VERSION"]),
    },
    displayDetection: await optionalJson(valueAfter("--display-report")),
    assignment: await optionalJson(valueAfter("--assignment")),
    performance: await optionalJson(valueAfter("--performance")),
    configuration: await optionalJson(valueAfter("--configuration")),
    presentation: {
      locale: valueAfter("--locale") ?? "en-GB",
      units: valueAfter("--units") ?? "metric",
      theme: valueAfter("--theme") ?? "night",
      telemetrySource: "simulated loopback only",
    },
    safety:
      "RXOS is simulated, read-only, secondary to factory instrumentation, disconnected from physical vehicle interfaces and unable to control vehicle systems.",
  });
  await writeFile(
    resolve(output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  for (const screenshot of arguments_
    .filter((argument) => argument.startsWith("--screenshot="))
    .map((argument) => argument.slice("--screenshot=".length))) {
    await copyFile(resolve(screenshot), resolve(output, basename(screenshot)));
  }
  for (const logPath of arguments_
    .filter((argument) => argument.startsWith("--log="))
    .map((argument) => argument.slice("--log=".length))) {
    const contents = await readFile(resolve(logPath), "utf8");
    await writeFile(
      resolve(output, `log-${basename(logPath)}`),
      redactDiagnosticText(contents).slice(-1_000_000),
    );
  }
  await writeFile(
    resolve(output, "README.md"),
    [
      "# RXOS prototype diagnostic bundle",
      "",
      "This allow-listed bundle contains RXOS prototype evidence only.",
      "It excludes environment variables, authentication data, personal files and unrelated system logs.",
      "",
      "It is not automotive certification or representative-hardware evidence unless the manifest identifies genuine hardware.",
      "",
    ].join("\n"),
  );
  console.log(
    JSON.stringify({
      component: "prototype-diagnostics",
      event: "bundle_created",
      output,
    }),
  );
}

await run();
