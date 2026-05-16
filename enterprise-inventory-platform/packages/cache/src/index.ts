import { getEnv } from "@enterprise-inventory/config";
import { GlideClient } from "@valkey/valkey-glide";

export interface CacheHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function createValkeyClient(): Promise<GlideClient> {
  const env = getEnv();

  return GlideClient.createClient({
    addresses: [{ host: env.VALKEY_HOST, port: env.VALKEY_PORT }],
    requestTimeout: env.HEALTHCHECK_TIMEOUT_MS,
    clientName: env.APP_NAME,
  });
}

export async function checkValkeyHealth(): Promise<CacheHealth> {
  const startedAt = performance.now();
  let client: GlideClient | undefined;

  try {
    client = await createValkeyClient();
    const response = await client.ping();

    return {
      ok: response === "PONG",
      latencyMs: Math.round(performance.now() - startedAt),
      ...(response === "PONG" ? {} : { error: `Unexpected Valkey response: ${String(response)}` }),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : "Unknown Valkey error",
    };
  } finally {
    client?.close();
  }
}
