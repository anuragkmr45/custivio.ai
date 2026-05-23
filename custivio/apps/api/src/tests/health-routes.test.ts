import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

describe("Fastify health routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns live health metadata", async () => {
    const response = await app.inject({ method: "GET", url: "/api/health/live" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "custivio",
    });
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("returns readiness shape", async () => {
    const response = await app.inject({ method: "GET", url: "/api/health/ready" });
    const readyBody = response.json<{ dependencies?: unknown; requestId?: unknown }>();

    expect([200, 503]).toContain(response.statusCode);
    expect(Array.isArray(readyBody.dependencies)).toBe(true);
    expect(readyBody.requestId).toBeTruthy();
  });

  it("returns Prometheus metrics text", async () => {
    await app.inject({ method: "GET", url: "/api/health/live" });
    const response = await app.inject({ method: "GET", url: "/api/metrics" });
    const metrics = response.body;

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(metrics).toContain("api_requests_total");
    expect(metrics).toContain("api_request_duration_seconds");
    expect(metrics).toContain("auth_login_attempts_total");
    expect(metrics).toContain("asset_mutations_total");
    expect(metrics).toContain("stock_movements_total");
    expect(metrics).toContain("import_jobs_total");
    expect(metrics).toContain("export_jobs_total");
    expect(metrics).toContain("file_operations_total");
    expect(metrics).toContain("worker_jobs_total");
    expect(metrics).toContain("dependency_failures_total");
  });

  it("exposes OpenAPI JSON and Swagger UI", async () => {
    const specResponse = await app.inject({ method: "GET", url: "/api/openapi.json" });
    const docsResponse = await app.inject({ method: "GET", url: "/api/docs" });

    expect(specResponse.statusCode).toBe(200);
    expect(specResponse.json()).toMatchObject({
      openapi: "3.0.3",
      info: { title: "Custivio API" },
    });
    expect(docsResponse.statusCode).toBe(200);
    expect(String(docsResponse.headers["content-type"])).toContain("text/html");
  });
});
