import {
  createImportPreviewForSession,
  listReportingOverview,
  processImportJobForSession,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import { readRecordBody, requireParam } from "../http/validation";
import {
  createdResponse,
  idParamsSchema,
  jsonResponse,
  recordBodySchema,
  routeSchema,
} from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function importsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/imports/jobs",
    {
      schema: routeSchema({
        tags: ["imports"],
        summary: "List import jobs.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listReportingOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { importJobs: overview.importJobs });
    },
  );

  app.post(
    "/api/imports/jobs",
    {
      schema: routeSchema({
        tags: ["imports"],
        summary: "Create an import preview job.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const preview = await createImportPreviewForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { preview }, 201);
    },
  );

  app.post(
    "/api/imports/jobs/:id/process",
    {
      schema: routeSchema({
        tags: ["imports"],
        summary: "Process an import job.",
        params: idParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const job = await processImportJobForSession(request.sessionToken, id, request.requestId);

      return sendJson(reply, request.requestId, { job });
    },
  );
}
