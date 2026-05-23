import { createValkeyClient } from "./valkey-client";

export * from "./rate-limit";
export * from "./locks";
export * from "./idempotency";
export * from "./queue";
export * from "./valkey-client";

export interface CacheHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function checkValkeyHealth(): Promise<CacheHealth> {
  const startedAt = performance.now();
  let client: Awaited<ReturnType<typeof createValkeyClient>> | undefined;

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
