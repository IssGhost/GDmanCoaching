import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "dist", "node_modules", ".railway", ".nixpacks"]);
const checkedExtensions = new Set([
  ".cjs", ".css", ".html", ".js", ".jsx", ".json", ".md", ".mjs", ".toml", ".ts", ".tsx", ".yml", ".yaml",
]);
const conflictMarker = /^(<<<<<<<|=======|>>>>>>>)($|\s)/m;
const conflicts = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(fullPath);
      continue;
    }

    if (!checkedExtensions.has(path.extname(entry.name))) continue;
    const contents = await readFile(fullPath, "utf8");
    if (conflictMarker.test(contents)) conflicts.push(path.relative(root, fullPath));
  }
}

await scan(root);

if (conflicts.length) {
  console.error("Unresolved merge-conflict markers found:");
  for (const file of conflicts) console.error(`- ${file}`);
  process.exit(1);
}

console.log("No unresolved merge-conflict markers found.");
