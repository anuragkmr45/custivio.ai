import { getReadinessHttpStatus, getReadinessStatus } from "@custivio/core";

import { sendJson } from "../http/responses";
import { jsonResponse, routeSchema } from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function opsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/ops/status",
    {
      schema: routeSchema({
        tags: ["ops"],
        summary: "Return operational dependency status and runbook links.",
        response: jsonResponse("OpsStatusResponse"),
      }),
    },
    async (request, reply) => {
      const readiness = await getReadinessStatus();

      return sendJson(
        reply,
        request.requestId,
        {
          service: "custivio",
          environment: "self-hosted",
          operationalStatus: readiness.status,
          dependencies: readiness.dependencies,
          checkedAt: readiness.checkedAt,
          runbooks: {
            backupRestore: "/docs/operations/BACKUP_RESTORE.md",
            observability: "/docs/operations/OBSERVABILITY_AND_ALERTS.md",
          },
          requestId: request.requestId,
        },
        getReadinessHttpStatus(readiness),
      );
    },
  );
}
