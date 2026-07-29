import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve("packages/design-system/translations");
const files = (await readdir(directory))
  .filter((file) => file.endsWith(".ts"))
  .sort();
if (files.length !== 6)
  throw new Error(`Expected six translation catalogs, found ${files.length}`);

let sourceIdentifiers: readonly string[] | undefined;
for (const file of files) {
  const content = await readFile(resolve(directory, file), "utf8");
  if (content.includes('type="unfinished"'))
    throw new Error(`${file} contains unfinished translations`);
  const identifiers = [...content.matchAll(/<message id="([^"]+)">/gu)]
    .map((match) => match[1])
    .filter((identifier): identifier is string => identifier !== undefined)
    .sort();
  if (new Set(identifiers).size !== identifiers.length)
    throw new Error(`${file} contains duplicate translation identifiers`);
  sourceIdentifiers ??= identifiers;
  if (JSON.stringify(identifiers) !== JSON.stringify(sourceIdentifiers))
    throw new Error(`${file} does not match the source identifier set`);
  if (file.includes("en_XA") && !content.includes("⟦"))
    throw new Error("Expanded pseudo-locale is missing visible delimiters");
  if (file.includes("ar_XB") && !content.includes("⟦"))
    throw new Error("RTL pseudo-locale is missing visible delimiters");
}
console.log(
  JSON.stringify({
    component: "localisation-validator",
    event: "validation_complete",
    catalogs: files.length,
    identifiers: sourceIdentifiers?.length ?? 0,
  }),
);
