import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  analyseTouchSession,
  createOcclusionReport,
  svgReviewOverlay,
  type OcclusionInput,
  type TouchObservation,
  type TouchTarget,
} from "./prototype-tools.js";

async function run(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const valueAfter = (name: string): string | undefined => {
    const index = arguments_.indexOf(name);
    return index >= 0 ? arguments_[index + 1] : undefined;
  };
  const kind = valueAfter("--kind");
  const inputPath = valueAfter("--input");
  if (!kind || !inputPath)
    throw new Error(
      "Usage: prototype-review --kind occlusion|touch --input <json>",
    );
  const outputDirectory = resolve(
    valueAfter("--output") ?? "build/prototype-review",
  );
  await mkdir(outputDirectory, { recursive: true });
  const input = JSON.parse(
    await readFile(resolve(inputPath), "utf8"),
  ) as unknown;
  if (kind === "occlusion") {
    const report = createOcclusionReport(input as OcclusionInput);
    await writeFile(
      resolve(outputDirectory, "driver-occlusion.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    await writeFile(
      resolve(outputDirectory, "driver-occlusion.svg"),
      svgReviewOverlay(
        "driver",
        (input as OcclusionInput).displayWidthPx,
        (input as OcclusionInput).displayHeightPx,
        report,
      ),
    );
    await writeFile(
      resolve(outputDirectory, "driver-occlusion.md"),
      `# Driver occlusion review\n\nAutomated geometry only; physical visibility remains open.\n\n${report.regions.map((region) => `- ${region.name}: ${region.occluded ? "possibly occluded" : "outside modelled wheel circle"}`).join("\n")}\n`,
    );
  } else if (kind === "touch") {
    const candidate = input as {
      readonly targets: readonly TouchTarget[];
      readonly observations: readonly TouchObservation[];
    };
    const results = analyseTouchSession(
      candidate.targets,
      candidate.observations,
    );
    await writeFile(
      resolve(outputDirectory, "cabin-touch.json"),
      `${JSON.stringify({ results, biometricDataCollected: false }, null, 2)}\n`,
    );
    await writeFile(
      resolve(outputDirectory, "cabin-touch.md"),
      `# Cabin touch review\n\nSynthetic or manually entered observations; no biometric data.\n\n${results
        .map((result) => {
          const outcome = result.hit
            ? "hit"
            : `miss (${result.missDistancePx.toFixed(1)} px)`;
          const adjacent = result.accidentalAdjacentActivation
            ? "; adjacent activation"
            : "";
          return `- ${result.targetId}: ${outcome}${adjacent}`;
        })
        .join("\n")}\n`,
    );
  } else throw new Error("Unknown prototype review kind");
}

await run();
