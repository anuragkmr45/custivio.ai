import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildRateLimitKey } from "@custivio/cache";

import { buildApiApp } from "../../apps/api/src/app";

const rootDir = new URL("../..", import.meta.url).pathname;

function readProjectFile(path: string): string {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("production hardening artifacts", () => {
  it("creates stable, non-PII Valkey rate-limit keys", () => {
    const first = buildRateLimitKey({
      scope: "Auth Login",
      identity: "Default:User@Example.Test:10.0.0.1",
    });
    const second = buildRateLimitKey({
      scope: "auth login",
      identity: "default:user@example.test:10.0.0.1",
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^rate-limit:auth_login:[a-f0-9]{32}$/);
    expect(first).not.toContain("user@example.test");
  });

  it("keeps required security headers in the Fastify security plugin", async () => {
    const app = await buildApiApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/health/live",
      });

      for (const header of [
        "content-security-policy",
        "cross-origin-opener-policy",
        "permissions-policy",
        "referrer-policy",
        "x-content-type-options",
        "x-frame-options",
      ]) {
        expect(response.headers[header], header).toBeDefined();
      }
    } finally {
      await app.close();
    }
  });

  it("allows the local frontend development origins on Vite ports 8080 and 8081", async () => {
    const app = await buildApiApp();

    try {
      for (const origin of ["http://localhost:8080", "http://localhost:8081"]) {
        const response = await app.inject({
          method: "GET",
          url: "/api/auth/me",
          headers: {
            origin,
          },
        });

        expect(response.headers["access-control-allow-origin"]).toBe(origin);
        expect(response.headers["access-control-allow-credentials"]).toBe("true");
      }
    } finally {
      await app.close();
    }
  });

  it("allows browser mutation preflights for the frontend API client", async () => {
    const app = await buildApiApp();

    try {
      const response = await app.inject({
        method: "OPTIONS",
        url: "/api/assets/asset-id/attachments/attachment-id",
        headers: {
          origin: "http://localhost:5177",
          "access-control-request-method": "DELETE",
          "access-control-request-headers": "content-type,idempotency-key",
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5177");
      expect(String(response.headers["access-control-allow-methods"])).toContain("DELETE");
      expect(String(response.headers["access-control-allow-headers"])).toContain("content-type");
      expect(String(response.headers["access-control-expose-headers"])).toContain("x-request-id");
    } finally {
      await app.close();
    }
  });

  it("ships production operation runbooks and release signoff templates", () => {
    for (const filePath of [
      "docs/operations/BACKUP_RESTORE.md",
      "docs/operations/AIR_GAP_DEPLOYMENT.md",
      "docs/operations/SECURITY_HARDENING.md",
      "docs/operations/OBSERVABILITY_AND_ALERTS.md",
      "docs/operations/ADMIN_GUIDE.md",
      "docs/operations/USER_GUIDE.md",
      "docs/operations/RELEASE_CHECKLIST.md",
      "docs/QA/UAT_SIGNOFF.md",
    ]) {
      expect(existsSync(join(rootDir, filePath))).toBe(true);
    }
  });

  it("provisions a Grafana production hardening dashboard", () => {
    const dashboard = JSON.parse(
      readProjectFile("infra/grafana/dashboards/production-hardening.json"),
    ) as { title?: string; panels?: unknown[] };

    expect(dashboard.title).toBe("Production Hardening");
    expect(dashboard.panels?.length).toBeGreaterThanOrEqual(3);
  });
});
