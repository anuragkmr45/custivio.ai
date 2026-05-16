#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const ignoredDirectories = new Set([".git", ".next", "coverage", "dist", "node_modules", ".turbo"]);

const manifestDependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const forbiddenPackages = [
  "prisma",
  "@prisma/client",
  "@supabase/supabase-js",
  "firebase",
  "firebase-admin",
  "mongodb",
  "mongoose",
  "@neondatabase/serverless",
  "@clerk/nextjs",
  "resend",
  "@vercel/blob",
];

const forbiddenPackagePrefixes = ["@supabase/", "@neondatabase/", "firebase/"];
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function walkFiles(startDirectory) {
  const files = [];
  const entries = readdirSync(startDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = join(startDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function isForbiddenPackage(packageName) {
  return (
    forbiddenPackages.includes(packageName) ||
    forbiddenPackagePrefixes.some((prefix) => packageName.startsWith(prefix))
  );
}

export function findPackageManifests(startDirectory = rootDir) {
  return walkFiles(startDirectory).filter((filePath) => filePath.endsWith("package.json"));
}

export function findForbiddenDependencies(startDirectory = rootDir) {
  const violations = [];

  for (const manifestPath of findPackageManifests(startDirectory)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    for (const section of manifestDependencySections) {
      const dependencies = manifest[section];

      if (!dependencies || typeof dependencies !== "object") {
        continue;
      }

      for (const packageName of Object.keys(dependencies)) {
        if (isForbiddenPackage(packageName)) {
          violations.push({
            filePath: relative(startDirectory, manifestPath),
            packageName,
            section,
          });
        }
      }
    }
  }

  return violations;
}

function extractImportedPackages(source) {
  const importedPackages = new Set();
  const importPatterns = [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const importedPath = match[1];

      if (importedPath) {
        importedPackages.add(importedPath);
      }
    }
  }

  return [...importedPackages];
}

export function findForbiddenImports(startDirectory = rootDir) {
  const violations = [];

  for (const filePath of walkFiles(startDirectory)) {
    if (!sourceExtensions.some((extension) => filePath.endsWith(extension))) {
      continue;
    }

    const source = readFileSync(filePath, "utf8");

    for (const importedPackage of extractImportedPackages(source)) {
      if (isForbiddenPackage(importedPackage)) {
        violations.push({
          filePath: relative(startDirectory, filePath),
          packageName: importedPackage,
        });
      }
    }
  }

  return violations;
}

export function runForbiddenDependencyCheck(startDirectory = rootDir) {
  if (!existsSync(startDirectory) || !statSync(startDirectory).isDirectory()) {
    throw new Error(`Project directory does not exist: ${startDirectory}`);
  }

  return {
    dependencyViolations: findForbiddenDependencies(startDirectory),
    importViolations: findForbiddenImports(startDirectory),
  };
}

function printViolations() {
  const result = runForbiddenDependencyCheck(rootDir);
  const violations = [...result.dependencyViolations, ...result.importViolations];

  if (violations.length === 0) {
    console.log("Forbidden dependency check passed.");
    return 0;
  }

  console.error("Forbidden dependency check failed:");

  for (const violation of violations) {
    if ("section" in violation) {
      console.error(`- ${violation.filePath}: ${violation.packageName} in ${violation.section}`);
    } else {
      console.error(`- ${violation.filePath}: imports ${violation.packageName}`);
    }
  }

  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = printViolations();
}
