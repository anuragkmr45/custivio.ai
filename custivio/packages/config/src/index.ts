import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().min(1).default("custivio"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  API_HOST: z.string().min(1).default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default(
      [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
      ].join(","),
    ),
  COOKIE_SECURE: z.coerce.boolean().optional(),
  DATABASE_URL: z.url().default("postgresql://custivio:custivio_dev@localhost:5432/custivio"),
  VALKEY_HOST: z.string().min(1).default("localhost"),
  VALKEY_PORT: z.coerce.number().int().positive().default(6379),
  MINIO_ENDPOINT: z.url().default("http://localhost:9000"),
  MINIO_REGION: z.string().min(1).default("us-east-1"),
  MINIO_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  MINIO_SECRET_KEY: z.string().min(1).default("minioadmin"),
  MINIO_BUCKET: z.string().min(1).default("custivio"),
  HEALTHCHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  OTEL_SERVICE_NAME: z.string().min(1).default("custivio-api"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  METRICS_PREFIX: z.string().min(1).default("custivio_"),
  DEV_SEED_TENANT_NAME: z.string().min(1).default("Default Tenant"),
  UAT_ADMIN_EMAIL: z.email().optional(),
  UAT_MANAGER_EMAIL: z.email().optional(),
  UAT_STORE_EMAIL: z.email().optional(),
  UAT_TECHNICIAN_EMAIL: z.email().optional(),
  UAT_APPROVER_EMAIL: z.email().optional(),
  UAT_AUDITOR_EMAIL: z.email().optional(),
  UAT_VIEWER_EMAIL: z.email().optional(),
  UAT_SEED_PASSWORD: z.string().min(12).optional(),
  BOOTSTRAP_TENANT_SLUG: z.string().min(1).optional(),
  BOOTSTRAP_TENANT_NAME: z.string().min(1).optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.email().optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().min(1).optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;
let cachedDotEnv: NodeJS.ProcessEnv | undefined;

function findLocalEnvFile(startDirectory: string): string | undefined {
  let currentDirectory = startDirectory;

  for (;;) {
    const candidate = join(currentDirectory, ".env");

    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return undefined;
    }

    currentDirectory = parentDirectory;
  }
}

function parseDotEnvFile(contents: string): NodeJS.ProcessEnv {
  const values: NodeJS.ProcessEnv = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadLocalEnvFile(): NodeJS.ProcessEnv {
  if (cachedDotEnv) return cachedDotEnv;

  const envFile = findLocalEnvFile(process.cwd());
  cachedDotEnv = envFile ? parseDotEnvFile(readFileSync(envFile, "utf8")) : {};

  return cachedDotEnv;
}

export function parseEnv(input: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv({ ...loadLocalEnvFile(), ...process.env });
  return cachedEnv;
}

export function resetEnvCacheForTests(): void {
  cachedEnv = undefined;
  cachedDotEnv = undefined;
}
