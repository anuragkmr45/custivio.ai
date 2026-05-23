import { getReadinessHttpStatus, getReadinessStatus } from "@custivio/core";

import { sendJson } from "../http/responses";
import { jsonResponse, routeSchema } from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function healthRoutes(app: FastifyInstance): void {
  app.get(
    "/api/health/live",
    {
      schema: routeSchema({
        tags: ["health"],
        summary: "Check API process liveness.",
        response: jsonResponse("LiveHealthResponse"),
      }),
    },
    (request, reply) =>
      sendJson(reply, request.requestId, {
        status: "ok",
        service: "custivio",
        checkedAt: new Date().toISOString(),
        requestId: request.requestId,
      }),
  );

  app.get(
    "/api/health/ready",
    {
      schema: routeSchema({
        tags: ["health"],
        summary: "Check PostgreSQL, Valkey, and MinIO readiness.",
        response: jsonResponse("ReadinessResponse"),
      }),
    },
    async (request, reply) => {
      const readiness = await getReadinessStatus();

      return sendJson(
        reply,
        request.requestId,
        {
          ...readiness,
          requestId: request.requestId,
        },
        getReadinessHttpStatus(readiness),
      );
    },
  );
}
