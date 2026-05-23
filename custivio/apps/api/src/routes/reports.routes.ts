import {
  createExportJobForSession,
  createSavedFilterForSession,
  getExportDownloadForSession,
  listReportingOverview,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import { readRecordBody, requireParam } from "../http/validation";
import {
  createdResponse,
  exportDownloadParamsSchema,
  fileResponse,
  jsonResponse,
  recordBodySchema,
  routeSchema,
} from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function reportsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/reports/exports",
    {
      schema: routeSchema({
        tags: ["reports"],
        summary: "List report export jobs.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listReportingOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { exportJobs: overview.exportJobs });
    },
  );

  app.post(
    "/api/reports/exports",
    {
      schema: routeSchema({
        tags: ["reports"],
        summary: "Create a report export job.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const exportJob = await createExportJobForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { exportJob }, 201);
    },
  );

  app.get(
    "/api/reports/exports/:exportId/download",
    {
      schema: routeSchema({
        tags: ["reports"],
        summary: "Download a generated report export through the API.",
        params: exportDownloadParamsSchema,
        response: fileResponse("Binary report export stream."),
      }),
    },
    async (request, reply) => {
      const exportId = requireParam(request.params, "exportId");
      const download = await getExportDownloadForSession(
        request.sessionToken,
        exportId,
        request.requestId,
      );

      return reply
        .status(200)
        .header("x-request-id", request.requestId)
        .type(download.object.contentType)
        .header("content-disposition", download.contentDisposition)
        .header(
          "content-length",
          String(
            download.exportJob.contentLength ??
              download.object.contentLength ??
              download.object.body.byteLength,
          ),
        )
        .send(Buffer.from(download.object.body));
    },
  );

  app.get(
    "/api/reports/filters",
    {
      schema: routeSchema({
        tags: ["reports"],
        summary: "List saved report filters.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listReportingOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { savedFilters: overview.savedFilters });
    },
  );

  app.post(
    "/api/reports/filters",
    {
      schema: routeSchema({
        tags: ["reports"],
        summary: "Create a saved report filter.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const filter = await createSavedFilterForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { filter }, 201);
    },
  );
}
