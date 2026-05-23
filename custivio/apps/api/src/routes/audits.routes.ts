import {
  createAuditCampaignForSession,
  listReportingOverview,
  recordAuditScanForSession,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import { readRecordBody } from "../http/validation";
import { createdResponse, jsonResponse, recordBodySchema, routeSchema } from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function auditsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/audits/campaigns",
    {
      schema: routeSchema({
        tags: ["audits"],
        summary: "List audit campaigns.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listReportingOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { campaigns: overview.campaigns });
    },
  );

  app.post(
    "/api/audits/campaigns",
    {
      schema: routeSchema({
        tags: ["audits"],
        summary: "Create an audit campaign.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const campaign = await createAuditCampaignForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { campaign }, 201);
    },
  );

  app.post(
    "/api/audits/scans",
    {
      schema: routeSchema({
        tags: ["audits"],
        summary: "Record an audit scan result.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const scan = await recordAuditScanForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { scan }, 201);
    },
  );
}
