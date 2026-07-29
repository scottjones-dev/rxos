import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface Report {
  readonly environment?: Readonly<Record<string, unknown>>;
  readonly runs?: readonly {
    readonly topology?: string;
    readonly scenario?: string;
    readonly hz?: number;
    readonly durationSeconds?: number;
    readonly memoryAnalysis?: Readonly<
      Record<string, Readonly<Record<string, unknown>>>
    >;
    readonly nativeLogs?: readonly Readonly<Record<string, unknown>>[];
  }[];
}

const input = process.argv[2];
if (!input) throw new Error("Usage: performance-summary <report> [output]");
const report = JSON.parse(await readFile(resolve(input), "utf8")) as Report;
const lines = [
  "# RXOS native performance observation",
  "",
  "Host-sensitive development evidence only; not representative-hardware or automotive qualification.",
  "",
  `Environment: \`${JSON.stringify(report.environment ?? {})}\``,
  "",
];
for (const run of report.runs ?? []) {
  lines.push(
    `## ${run.topology ?? "unknown"} · ${run.scenario ?? "default"} · ${run.hz ?? "?"} Hz`,
    "",
    `Duration: ${run.durationSeconds ?? "?"} seconds.`,
    "",
  );
  for (const [processName, analysis] of Object.entries(
    run.memoryAnalysis ?? {},
  ))
    lines.push(
      `- ${processName} memory: ${String(analysis.classification ?? "unclassified")}`,
    );
  const frameLogs = (run.nativeLogs ?? []).filter(
    (entry) => entry.event === "frame_timing_summary",
  );
  for (const frame of frameLogs)
    lines.push(
      `- ${String(frame.component)} frames: median ${String(frame.medianMs)} ms, p95 ${String(frame.p95Ms)} ms, p99 ${String(frame.p99Ms)} ms, maximum ${String(frame.maximumMs)} ms`,
    );
  lines.push("");
}
const markdown = `${lines.join("\n")}\n`;
const output = process.argv[3];
if (output) await writeFile(resolve(output), markdown);
else process.stdout.write(markdown);
