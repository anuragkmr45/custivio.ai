import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RouteCase {
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}

const preservedApiRouteCases: RouteCase[] = [
  { method: "GET", path: "/api/admin/assignments" },
  { method: "GET", path: "/api/admin/roles" },
  { method: "GET", path: "/api/admin/users" },
  { method: "POST", path: "/api/assets/test-id/attachments" },
  { method: "POST", path: "/api/assets/test-id/lifecycle", body: {} },
  { method: "GET", path: "/api/assets/test-id" },
  { method: "PATCH", path: "/api/assets/test-id", body: {} },
  { method: "GET", path: "/api/assets" },
  { method: "POST", path: "/api/assets", body: {} },
  { method: "GET", path: "/api/audits/campaigns" },
  { method: "POST", path: "/api/audits/campaigns", body: {} },
  { method: "POST", path: "/api/audits/scans", body: {} },
  { method: "POST", path: "/api/auth/login", body: {} },
  { method: "POST", path: "/api/auth/logout" },
  { method: "GET", path: "/api/auth/me" },
  { method: "GET", path: "/api/catalog/categories" },
  { method: "POST", path: "/api/catalog/categories", body: {} },
  { method: "PATCH", path: "/api/catalog/categories/test-id", body: {} },
  { method: "DELETE", path: "/api/catalog/categories/test-id" },
  { method: "POST", path: "/api/custody/checkins", body: {} },
  { method: "GET", path: "/api/custody/checkouts" },
  { method: "POST", path: "/api/custody/checkouts", body: {} },
  { method: "POST", path: "/api/custody/handovers", body: {} },
  { method: "GET", path: "/api/health/live" },
  { method: "GET", path: "/api/health/ready" },
  { method: "POST", path: "/api/imports/jobs/test-id/process" },
  { method: "GET", path: "/api/imports/jobs" },
  { method: "POST", path: "/api/imports/jobs", body: {} },
  { method: "POST", path: "/api/maintenance/tickets/test-id/status", body: {} },
  { method: "GET", path: "/api/maintenance/tickets" },
  { method: "POST", path: "/api/maintenance/tickets", body: {} },
  { method: "GET", path: "/api/maintenance/warranties" },
  { method: "POST", path: "/api/maintenance/warranties", body: {} },
  { method: "GET", path: "/api/metrics" },
  { method: "GET", path: "/api/ops/status" },
  { method: "GET", path: "/api/reports/exports" },
  { method: "POST", path: "/api/reports/exports", body: {} },
  { method: "GET", path: "/api/reports/filters" },
  { method: "POST", path: "/api/reports/filters", body: {} },
  { method: "GET", path: "/api/stock/items" },
  { method: "POST", path: "/api/stock/items", body: {} },
  { method: "POST", path: "/api/stock/movements", body: {} },
  { method: "POST", path: "/api/stock/units", body: {} },
  { method: "POST", path: "/api/transfers/test-id/decision", body: {} },
  { method: "GET", path: "/api/transfers" },
  { method: "POST", path: "/api/transfers", body: {} },
];

describe("Fastify route parity", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers every preserved API route method", async () => {
    expect(preservedApiRouteCases).toHaveLength(46);

    for (const routeCase of preservedApiRouteCases) {
      const response = await app.inject({
        method: routeCase.method,
        url: routeCase.path,
        headers: { accept: "application/json" },
        ...(routeCase.body ? { payload: routeCase.body } : {}),
      });

      expect(response.statusCode, `${routeCase.method} ${routeCase.path}`).not.toBe(404);
    }
  });
});
