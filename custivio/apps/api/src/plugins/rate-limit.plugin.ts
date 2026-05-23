import { checkSensitiveMutationRateLimit } from "@custivio/core";
import fp from "fastify-plugin";

import { sendJson } from "../http/responses";

import type { FastifyRequest } from "fastify";

interface MutationRateLimitPolicy {
  limit: number;
  scope: string;
  windowSeconds: number;
}

function getPathname(request: FastifyRequest): string {
  return new URL(request.url, "http://custivio.local").pathname;
}

function getRateLimitPolicy(request: FastifyRequest): MutationRateLimitPolicy | undefined {
  const method = request.method.toUpperCase();
  const pathname = getPathname(request);

  if (
    (method === "POST" || method === "PATCH" || method === "DELETE") &&
    pathname.startsWith("/api/admin/")
  ) {
    return { limit: 40, scope: "api:admin-mutation", windowSeconds: 60 };
  }

  if (
    (method === "POST" || method === "PATCH" || method === "DELETE") &&
    pathname.startsWith("/api/catalog/")
  ) {
    return { limit: 60, scope: "api:catalog-mutation", windowSeconds: 60 };
  }

  if (
    (method === "POST" || method === "PATCH" || method === "DELETE") &&
    pathname.startsWith("/api/locations/")
  ) {
    return { limit: 60, scope: "api:location-mutation", windowSeconds: 60 };
  }

  if (
    (method === "POST" || method === "PATCH") &&
    (pathname === "/api/assets" ||
      /^\/api\/assets\/[^/]+$/.test(pathname) ||
      /^\/api\/assets\/[^/]+\/lifecycle$/.test(pathname))
  ) {
    return { limit: 60, scope: "api:asset-mutation", windowSeconds: 60 };
  }

  if (method === "POST" && /^\/api\/assets\/[^/]+\/attachments$/.test(pathname)) {
    return { limit: 20, scope: "api:attachment-upload", windowSeconds: 60 };
  }

  if (
    (method === "GET" || method === "DELETE") &&
    /^\/api\/assets\/[^/]+\/attachments\/[^/]+/.test(pathname)
  ) {
    return { limit: 120, scope: "api:attachment-transfer", windowSeconds: 60 };
  }

  if (method === "POST" && pathname.startsWith("/api/stock/")) {
    return { limit: 60, scope: "api:stock-mutation", windowSeconds: 60 };
  }

  if (method === "POST" && pathname.startsWith("/api/custody/")) {
    return { limit: 60, scope: "api:custody-mutation", windowSeconds: 60 };
  }

  if (
    method === "POST" &&
    (pathname === "/api/transfers" || /^\/api\/transfers\/[^/]+\/decision$/.test(pathname))
  ) {
    return { limit: 60, scope: "api:transfer-mutation", windowSeconds: 60 };
  }

  if (method === "POST" && pathname.startsWith("/api/maintenance/")) {
    return { limit: 60, scope: "api:maintenance-mutation", windowSeconds: 60 };
  }

  if (method === "POST" && pathname.startsWith("/api/audits/")) {
    return { limit: 60, scope: "api:audit-mutation", windowSeconds: 60 };
  }

  if (method === "POST" && pathname === "/api/imports/jobs") {
    return { limit: 20, scope: "api:import-create", windowSeconds: 60 };
  }

  if (method === "POST" && /^\/api\/imports\/jobs\/[^/]+\/process$/.test(pathname)) {
    return { limit: 20, scope: "api:import-process", windowSeconds: 60 };
  }

  if (method === "POST" && pathname === "/api/reports/exports") {
    return { limit: 20, scope: "api:export-create", windowSeconds: 60 };
  }

  if (method === "GET" && /^\/api\/reports\/exports\/[^/]+\/download$/.test(pathname)) {
    return { limit: 120, scope: "api:export-download", windowSeconds: 60 };
  }

  if (method === "POST" && pathname === "/api/reports/filters") {
    return { limit: 60, scope: "api:report-filter-mutation", windowSeconds: 60 };
  }

  if (method === "GET" && pathname === "/api/metrics") {
    return { limit: 120, scope: "api:metrics-read", windowSeconds: 60 };
  }

  if (method === "GET" && pathname === "/api/ops/status") {
    return { limit: 120, scope: "api:ops-read", windowSeconds: 60 };
  }

  if (method === "GET" && (pathname === "/api/openapi.json" || pathname.startsWith("/api/docs"))) {
    return { limit: 60, scope: "api:docs-read", windowSeconds: 60 };
  }

  return undefined;
}

function getRateLimitIdentity(request: FastifyRequest): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const ipAddress = rawIp?.split(",")[0]?.trim() ?? request.ip;

  return [request.sessionToken ?? "anonymous", ipAddress, getPathname(request)].join(":");
}

export const rateLimitPlugin = fp((app, _options, done) => {
  app.addHook("onRequest", async (request, reply) => {
    const policy = getRateLimitPolicy(request);

    if (!policy) {
      return;
    }

    const result = await checkSensitiveMutationRateLimit({
      identity: getRateLimitIdentity(request),
      limit: policy.limit,
      scope: policy.scope,
      windowSeconds: policy.windowSeconds,
    });

    if (result.allowed) {
      return;
    }

    reply.header("retry-after", String(result.retryAfterSeconds));

    return sendJson(
      reply,
      request.requestId,
      {
        error: {
          code: "rate_limited",
          message: "Too many requests. Try again shortly.",
          requestId: request.requestId,
        },
      },
      429,
    );
  });

  done();
});
