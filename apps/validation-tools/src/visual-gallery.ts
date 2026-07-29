import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { outputName, visualScenarios } from "./scenarios.js";

const output = resolve(process.argv[2] ?? "build/visual/gallery/index.html");
const current = resolve(process.argv[3] ?? "build/visual/current");
const diff = resolve(process.argv[4] ?? "build/visual/diff");
const baseline = resolve(process.argv[5] ?? "tests/visual/baselines");
const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  encoding: "utf8",
}).trim();
await mkdir(resolve(output, ".."), { recursive: true });
const fromGallery = resolve(output, "..");
const cards = visualScenarios
  .map((scenario) => {
    const name = outputName(scenario);
    const image = relative(fromGallery, resolve(current, name)).replaceAll(
      "\\",
      "/",
    );
    const difference = relative(fromGallery, resolve(diff, name)).replaceAll(
      "\\",
      "/",
    );
    const reference = relative(fromGallery, resolve(baseline, name)).replaceAll(
      "\\",
      "/",
    );
    const profile = scenario.display === "driver" ? "2560x720" : "1920x1080";
    return `<article><h2>${scenario.display}: ${scenario.name}</h2><p>profile=${profile} theme/scenario=${scenario.name} locale=${scenario.locale ?? "en-GB"} units=${scenario.units ?? "metric"} scale=${scenario.scale ?? 1}</p><figure><figcaption>Baseline</figcaption><img src="${reference}" alt="${name} baseline"></figure><figure><figcaption>Current</figcaption><img src="${image}" alt="${name}"></figure><figure><figcaption>Difference</figcaption><img src="${difference}" alt="${name} difference"></figure></article>`;
  })
  .join("\n");
await writeFile(
  output,
  `<!doctype html><html><head><meta charset="utf-8"><title>RXOS visual validation</title><style>body{font:16px sans-serif;background:#111;color:#eee}article{margin:2rem}figure{display:inline-block;width:32%;margin:0 1% 1rem 0}img{max-width:100%;border:1px solid #555}</style></head><body><h1>RXOS visual validation</h1><p>commit=${commit} environment=${process.platform} / ${process.env.QT_QPA_PLATFORM ?? "offscreen"} / ${process.env.QSG_RHI_BACKEND ?? "software"}</p>${cards}</body></html>\n`,
);
