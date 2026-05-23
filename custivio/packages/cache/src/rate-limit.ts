import { createHash } from "node:crypto";

import { createValkeyClient } from "./valkey-client";

export interface RateLimitInput {
  scope: string;
  identity: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  windowSeconds: number;
  retryAfterSeconds: number;
  key: string;
  unavailable?: boolean;
  error?: string;
}

export function buildRateLimitKey(input: Pick<RateLimitInput, "scope" | "identity">): string {
  const scope = input.scope
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "_");
  const identityHash = createHash("sha256")
    .update(input.identity.trim().toLowerCase())
    .digest("hex");

  return `rate-limit:${scope}:${identityHash.slice(0, 32)}`;
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const key = buildRateLimitKey(input);
  const limit = Math.max(1, Math.floor(input.limit));
  const windowSeconds = Math.max(1, Math.floor(input.windowSeconds));
  let client: Awaited<ReturnType<typeof createValkeyClient>> | undefined;

  try {
    client = await createValkeyClient();
    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    const ttl = await client.ttl(key);
    const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;

    return {
      allowed: count <= limit,
      count,
      key,
      limit,
      retryAfterSeconds,
      windowSeconds,
    };
  } catch (error) {
    return {
      allowed: true,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown Valkey rate-limit error",
      key,
      limit,
      retryAfterSeconds: 0,
      unavailable: true,
      windowSeconds,
    };
  } finally {
    client?.close();
  }
}
