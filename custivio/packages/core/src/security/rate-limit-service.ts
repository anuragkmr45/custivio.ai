import { checkRateLimit, type RateLimitResult } from "@custivio/cache";
import { logger } from "@custivio/telemetry";

export interface LoginRateLimitInput {
  tenantSlug: string;
  email: string;
  ipAddress?: string | null;
}

export interface SensitiveMutationRateLimitInput {
  scope: string;
  identity: string;
  limit?: number;
  windowSeconds?: number;
}

function normalizeRateLimitPart(value: string, fallback: string): string {
  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 ? normalized : fallback;
}

export async function checkLoginRateLimit(input: LoginRateLimitInput): Promise<RateLimitResult> {
  const identity = [
    normalizeRateLimitPart(input.tenantSlug, "unknown-tenant"),
    normalizeRateLimitPart(input.email, "unknown-email"),
    normalizeRateLimitPart(input.ipAddress ?? "", "unknown-ip"),
  ].join(":");
  const result = await checkRateLimit({
    scope: "auth:login",
    identity,
    limit: 10,
    windowSeconds: 60,
  });

  if (result.unavailable) {
    logger.warn("Login rate limiter unavailable", {
      errorCode: "rate_limit_unavailable",
      context: {
        error: result.error ?? "unknown",
      },
    });
  }

  return result;
}

export async function checkSensitiveMutationRateLimit(
  input: SensitiveMutationRateLimitInput,
): Promise<RateLimitResult> {
  const result = await checkRateLimit({
    scope: input.scope,
    identity: input.identity,
    limit: input.limit ?? 30,
    windowSeconds: input.windowSeconds ?? 60,
  });

  if (result.unavailable) {
    logger.warn("Sensitive mutation rate limiter unavailable", {
      errorCode: "rate_limit_unavailable",
      context: {
        error: result.error ?? "unknown",
        scope: input.scope,
      },
    });
  }

  return result;
}
