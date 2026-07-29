import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { outputName, visualScenarios } from "./scenarios.js";
import { run } from "./process.js";

function defaultExecutable(display: "driver" | "cabin"): string {
  const suffix = process.platform === "win32" ? ".exe" : "";
  return resolve(
    "build/native/apps",
    `${display}-display`,
    `rxos-${display}-display${suffix}`,
  );
}

const outputDirectory = resolve(process.argv[2] ?? "build/visual/current");
const driver =
  process.env.RXOS_DRIVER_EXECUTABLE ?? defaultExecutable("driver");
const cabin = process.env.RXOS_CABIN_EXECUTABLE ?? defaultExecutable("cabin");
await mkdir(outputDirectory, { recursive: true });

for (const scenario of visualScenarios) {
  const output = resolve(outputDirectory, outputName(scenario));
  const executable = scenario.display === "driver" ? driver : cabin;
  const args = [
    "--capture",
    output,
    "--visual-scenario",
    scenario.name,
    "--locale",
    scenario.locale ?? "en-GB",
    "--units",
    scenario.units ?? "metric",
    "--scale",
    String(scenario.scale ?? 1),
  ];
  await run(executable, args, `${scenario.display}:${scenario.name}`);
}

await writeFile(
  resolve(outputDirectory, "manifest.json"),
  `${JSON.stringify(visualScenarios, null, 2)}\n`,
);
