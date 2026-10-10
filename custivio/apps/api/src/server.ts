import { logger } from "@custivio/telemetry";

import { buildApiApp } from "./app";
import { startEmbeddedWorker } from "./workers/embedded-worker";

const app = await buildApiApp();
const env = app.appConfig;
let embeddedWorker: ReturnType<typeof startEmbeddedWorker> | undefined;

app.addHook("onClose", async () => embeddedWorker?.stop());

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
  embeddedWorker = env.RUN_WORKER_IN_API ? startEmbeddedWorker(env.WORKER_INTERVAL_MS) : undefined;
  const localBaseUrl = buildLocalBaseUrl(env.API_HOST, env.API_PORT);
  logger.info("Fastify API started", {
    context: {
      host: env.API_HOST,
      port: env.API_PORT,
      localBaseUrl,
      healthUrl: `${localBaseUrl}/api/health/live`,
      docsUrl: `${localBaseUrl}/api/docs`,
    },
  });
  process.stdout.write(formatStartupBanner(localBaseUrl));
} catch (error) {
  logger.error("Fastify API failed to start", {
    errorCode: "api_start_failed",
    context: { error: error instanceof Error ? error.message : "unknown" },
  });
  process.exitCode = 1;
}

function buildLocalBaseUrl(host: string, port: number): string {
  const localHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;
  return `http://${localHost}:${String(port)}`;
}

function formatStartupBanner(localBaseUrl: string): string {
  return [
    "",
    "Fastify API ready",
    `  Local:   ${localBaseUrl}`,
    `  Health:  ${localBaseUrl}/api/health/live`,
    `  OpenAPI: ${localBaseUrl}/api/openapi.json`,
    `  Docs:    ${localBaseUrl}/api/docs`,
    "",
  ].join("\n");
}
