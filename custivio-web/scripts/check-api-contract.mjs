import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const generatedPath = path.join(repoRoot, "src/lib/api/generated/openapi.ts");

const REQUIRED_ENDPOINTS = [
  ["post", "/api/auth/login"],
  ["post", "/api/auth/logout"],
  ["get", "/api/auth/me"],
  ["get", "/api/health/live"],
  ["get", "/api/health/ready"],
  ["get", "/api/ops/status"],
  ["get", "/api/metrics"],
  ["get", "/api/assets"],
  ["post", "/api/assets"],
  ["get", "/api/assets/{id}"],
  ["patch", "/api/assets/{id}"],
  ["post", "/api/assets/{id}/lifecycle"],
  ["post", "/api/assets/{id}/attachments"],
  ["get", "/api/assets/{id}/attachments/{attachmentId}/download"],
  ["delete", "/api/assets/{id}/attachments/{attachmentId}"],
  ["get", "/api/stock/items"],
  ["post", "/api/stock/movements"],
  ["post", "/api/custody/handovers"],
  ["post", "/api/transfers/{id}/decision"],
  ["post", "/api/imports/jobs"],
  ["post", "/api/imports/jobs/{id}/process"],
  ["post", "/api/reports/exports"],
  ["get", "/api/reports/exports/{exportId}/download"],
];

async function main() {
  const generated = await readFile(generatedPath, "utf8");

  if (/Placeholder for generated OpenAPI types/i.test(generated)) {
    throw new Error("Generated OpenAPI file is still a placeholder.");
  }

  if (!generated.includes("OPENAPI_OPERATIONS")) {
    throw new Error("Generated OpenAPI file does not export OPENAPI_OPERATIONS.");
  }

  const operations = extractGeneratedOperations(generated);
  const operationKeys = new Set(
    operations.map((operation) => `${operation.method} ${operation.path}`),
  );

  const missing = REQUIRED_ENDPOINTS.filter(([method, openApiPath]) => {
    if (operationKeys.has(`${method} ${openApiPath}`)) return false;
    return !operations.some(
      (operation) =>
        operation.method === method && normalizePath(operation.path) === normalizePath(openApiPath),
    );
  });

  if (missing.length > 0) {
    throw new Error(
      `Generated OpenAPI contract is missing required endpoints: ${missing
        .map(([method, openApiPath]) => `${method.toUpperCase()} ${openApiPath}`)
        .join(", ")}`,
    );
  }

  console.log(`OpenAPI contract check passed with ${operations.length} generated operations.`);
}

function extractGeneratedOperations(source) {
  const match = source.match(/export const OPENAPI_OPERATIONS = ([\s\S]*?) as const;/);
  if (!match) {
    throw new Error("Could not find generated OPENAPI_OPERATIONS array.");
  }

  const operations = vm.runInNewContext(`(${match[1]})`, Object.freeze({}), {
    timeout: 1000,
  });

  if (!Array.isArray(operations)) {
    throw new Error("Generated OPENAPI_OPERATIONS is not an array.");
  }

  return operations;
}

function normalizePath(openApiPath) {
  return openApiPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
