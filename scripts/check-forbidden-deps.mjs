// scripts/check-forbidden-deps.mjs
// Fails CI if forbidden dependencies are added to package manifests.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const forbidden = [
  "prisma",
  "@prisma/client",
  "@supabase/supabase-js",
  "firebase",
  "mongoose",
  "mongodb",
  "@neondatabase/serverless"
];

const allowedFiles = new Set();

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".next", "dist", "build", ".git"].includes(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name === "package.json") files.push(full);
  }
  return files;
}

let failed = false;

for (const file of walk(root)) {
  if (allowedFiles.has(file)) continue;

  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

  for (const section of sections) {
    const deps = pkg[section] ?? {};
    for (const dep of forbidden) {
      if (deps[dep]) {
        console.error(`Forbidden dependency "${dep}" found in ${file} (${section}).`);
        failed = true;
      }
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("Forbidden dependency check passed.");
