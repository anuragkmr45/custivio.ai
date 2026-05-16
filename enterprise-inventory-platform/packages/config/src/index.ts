import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().min(1).default("enterprise-inventory-platform"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z
    .url()
    .default(
      "postgresql://enterprise_inventory:enterprise_inventory_dev@localhost:5432/enterprise_inventory",
    ),
  VALKEY_HOST: z.string().min(1).default("localhost"),
  VALKEY_PORT: z.coerce.number().int().positive().default(6379),
  MINIO_ENDPOINT: z.url().default("http://localhost:9000"),
  MINIO_REGION: z.string().min(1).default("us-east-1"),
  MINIO_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  MINIO_SECRET_KEY: z.string().min(1).default("minioadmin"),
  MINIO_BUCKET: z.string().min(1).default("enterprise-inventory"),
  HEALTHCHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  OTEL_SERVICE_NAME: z.string().min(1).default("enterprise-inventory-platform"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  METRICS_PREFIX: z.string().min(1).default("enterprise_inventory_"),
  DEV_SEED_TENANT_NAME: z.string().min(1).default("Default Tenant"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function parseEnv(input: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}

export function resetEnvCacheForTests(): void {
  cachedEnv = undefined;
}
