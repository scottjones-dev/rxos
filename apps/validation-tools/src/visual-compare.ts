import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { outputName, visualScenarios } from "./scenarios.js";

const baselineDirectory = resolve(process.argv[2] ?? "tests/visual/baselines");
const currentDirectory = resolve(process.argv[3] ?? "build/visual/current");
const differenceDirectory = resolve(process.argv[4] ?? "build/visual/diff");
const maximumDifference = Number(
  process.env.RXOS_VISUAL_MAX_DIFFERENCE ?? "0.002",
);
await mkdir(differenceDirectory, { recursive: true });

const results: Array<{
  name: string;
  changedPixels: number;
  ratio: number;
  passed: boolean;
}> = [];

for (const scenario of visualScenarios) {
  const name = outputName(scenario);
  const baseline = PNG.sync.read(
    await readFile(resolve(baselineDirectory, name)),
  );
  const current = PNG.sync.read(
    await readFile(resolve(currentDirectory, name)),
  );
  if (baseline.width !== current.width || baseline.height !== current.height)
    throw new Error(`Visual dimensions changed for ${name}`);
  const difference = new PNG({
    width: baseline.width,
    height: baseline.height,
  });
  const changedPixels = pixelmatch(
    baseline.data,
    current.data,
    difference.data,
    baseline.width,
    baseline.height,
    { threshold: 0.1 },
  );
  const ratio = changedPixels / (baseline.width * baseline.height);
  const passed = ratio <= maximumDifference;
  results.push({ name, changedPixels, ratio, passed });
  await writeFile(
    resolve(differenceDirectory, name),
    PNG.sync.write(difference),
  );
}

await writeFile(
  resolve(differenceDirectory, "results.json"),
  `${JSON.stringify({ maximumDifference, results }, null, 2)}\n`,
);
const failures = results.filter((result) => !result.passed);
if (failures.length > 0)
  throw new Error(
    `Visual regression threshold exceeded: ${failures
      .map((failure) => `${failure.name} (${failure.ratio.toFixed(4)})`)
      .join(", ")}`,
  );
