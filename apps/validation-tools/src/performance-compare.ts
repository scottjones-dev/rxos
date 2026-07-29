import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

interface Environment {
  readonly platform?: string;
  readonly architecture?: string;
  readonly buildType?: string;
  readonly qtPlatform?: string;
  readonly renderingBackend?: string;
  readonly screenProfiles?: unknown;
}

interface NativeLog {
  readonly component?: string;
  readonly event?: string;
  readonly accepted?: number;
  readonly hiddenWork?: number;
  readonly chartRenderedPoints?: number;
}

interface Run {
  readonly hz?: number;
  readonly topology?: string;
  readonly scenario?: string;
  readonly durationSeconds?: number;
  readonly nativeLogs?: readonly NativeLog[];
}

interface Report {
  readonly schemaVersion?: number;
  readonly environment?: Environment;
  readonly runs?: readonly Run[];
}

const environmentKeys: readonly (keyof Environment)[] = [
  "platform",
  "architecture",
  "buildType",
  "qtPlatform",
  "renderingBackend",
  "screenProfiles",
];

export function compareReports(
  baseline: Report,
  candidate: Report,
): Readonly<Record<string, unknown>> {
  const mismatches = environmentKeys
    .filter(
      (key) =>
        JSON.stringify(baseline.environment?.[key]) !==
        JSON.stringify(candidate.environment?.[key]),
    )
    .map((key) => ({
      key,
      baseline: baseline.environment?.[key],
      candidate: candidate.environment?.[key],
    }));
  if (mismatches.length > 0)
    return {
      comparable: false,
      reason: "environment mismatch",
      mismatches,
    };
  const baselineRuns = baseline.runs ?? [];
  const candidateRuns = candidate.runs ?? [];
  const runKeys = (run: Run): string =>
    [run.topology, run.scenario, run.hz, run.durationSeconds].join(":");
  const missingRuns = baselineRuns
    .map(runKeys)
    .filter((key) => !candidateRuns.some((run) => runKeys(run) === key));
  return {
    comparable: missingRuns.length === 0,
    reason: missingRuns.length > 0 ? "scenario mismatch" : "compatible",
    missingRuns,
  };
}

export function stableInvariantFailures(report: Report): readonly string[] {
  const failures: string[] = [];
  if (report.schemaVersion !== 2)
    failures.push("performance report schemaVersion must be 2");
  for (const run of report.runs ?? []) {
    const displayLogs = (run.nativeLogs ?? []).filter(
      (entry) => entry.event === "shutdown_summary",
    );
    if (run.topology !== "simulator" && displayLogs.length === 0)
      failures.push(
        `${run.topology ?? "unknown"} has no display shutdown summary`,
      );
    for (const log of displayLogs) {
      if ((log.accepted ?? 0) <= 0)
        failures.push(`${log.component ?? "display"} accepted no telemetry`);
      if ((log.hiddenWork ?? 0) !== 0)
        failures.push(`${log.component ?? "display"} reported hidden work`);
      if ((log.chartRenderedPoints ?? 0) > 240)
        failures.push(
          `${log.component ?? "display"} exceeded the chart render cap`,
        );
    }
  }
  return failures;
}

async function readReport(path: string): Promise<Report> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as Report;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const arguments_ = process.argv.slice(2);
  const candidatePath = arguments_[0];
  if (!candidatePath)
    throw new Error(
      "Usage: performance-compare <candidate> [baseline] [output]",
    );
  const candidate = await readReport(candidatePath);
  const baselinePath = arguments_[1];
  const comparison = baselinePath
    ? compareReports(await readReport(baselinePath), candidate)
    : { comparable: null, reason: "no baseline supplied" };
  const stableFailures = stableInvariantFailures(candidate);
  const result = { comparison, stableFailures };
  const outputPath = arguments_[2];
  if (outputPath)
    await writeFile(
      resolve(outputPath),
      `${JSON.stringify(result, null, 2)}\n`,
    );
  console.log(JSON.stringify(result, null, 2));
  if (stableFailures.length > 0) process.exitCode = 1;
}
