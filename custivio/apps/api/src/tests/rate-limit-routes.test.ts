import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type * as CoreModule from "@custivio/core";
import type { FastifyInstance } from "fastify";

const checkSensitiveMutationRateLimitMock = vi.hoisted(() => vi.fn());

interface TestRateLimitResult {
  allowed: boolean;
  count: number;
  key: string;
  limit: number;
  retryAfterSeconds: number;
  windowSeconds: number;
}

vi.mock("@custivio/core", async () => {
  const actual = await vi.importActual<typeof CoreModule>("@custivio/core");

  return {
    ...actual,
    checkSensitiveMutationRateLimit: checkSensitiveMutationRateLimitMock,
  };
});

function rateLimitResult(overrides: Partial<TestRateLimitResult>): TestRateLimitResult {
  return {
    allowed: true,
    count: 1,
    key: "rate-limit:test",
    limit: 1,
    retryAfterSeconds: 60,
    windowSeconds: 60,
    ...overrides,
  };
}

describe("Fastify sensitive mutation rate limits", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const { buildApiApp } = await import("../app");

    app = await buildApiApp();

    return async () => {
      await app.close();
    };
  });

  beforeEach(() => {
    checkSensitiveMutationRateLimitMock.mockReset();
    checkSensitiveMutationRateLimitMock.mockResolvedValue(rateLimitResult({ allowed: true }));
  });

  it("returns typed 429 before sensitive admin mutations", async () => {
    checkSensitiveMutationRateLimitMock.mockResolvedValue(
      rateLimitResult({ allowed: false, count: 2 }),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      headers: { accept: "application/json" },
      payload: {},
    });

    expect(response.statusCode).toBe(429);
    expect(response.headers["retry-after"]).toBe("60");
    expect(response.json()).toMatchObject({
      error: {
        code: "rate_limited",
      },
    });
  });

  it.each([
    ["asset create", "POST", "/api/assets"],
    ["asset lifecycle", "POST", "/api/assets/asset-1/lifecycle"],
    ["attachment upload", "POST", "/api/assets/asset-1/attachments"],
    ["stock movement", "POST", "/api/stock/movements"],
    ["import create", "POST", "/api/imports/jobs"],
    ["import process", "POST", "/api/imports/jobs/job-1/process"],
    ["export create", "POST", "/api/reports/exports"],
    ["export download", "GET", "/api/reports/exports/export-1/download"],
    ["catalog mutation", "PATCH", "/api/catalog/categories/category-1"],
    ["location mutation", "PATCH", "/api/locations/sites/site-1"],
    ["ops status", "GET", "/api/ops/status"],
    ["metrics", "GET", "/api/metrics"],
  ])("returns typed 429 before %s when policy is exhausted", async (_name, method, url) => {
    checkSensitiveMutationRateLimitMock.mockResolvedValue(
      rateLimitResult({ allowed: false, count: 2 }),
    );

    const response =
      method === "GET"
        ? await app.inject({ method: "GET", url, headers: { accept: "application/json" } })
        : method === "PATCH"
          ? await app.inject({
              method: "PATCH",
              url,
              headers: { accept: "application/json" },
              payload: {},
            })
          : await app.inject({
              method: "POST",
              url,
              headers: { accept: "application/json" },
              payload: {},
            });

    expect(response.statusCode).toBe(429);
    expect(response.headers["retry-after"]).toBe("60");
    expect(response.json()).toMatchObject({
      error: {
        code: "rate_limited",
      },
    });
  });

  it("does not rate-limit public health reads", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health/live",
      headers: { accept: "application/json" },
    });

    expect(response.statusCode).toBe(200);
    expect(checkSensitiveMutationRateLimitMock).not.toHaveBeenCalled();
  });
});
