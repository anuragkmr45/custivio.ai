import {
  createWarrantyForSession,
  listMaintenanceOverview,
  openMaintenanceTicketForSession,
  updateMaintenanceTicketStatusForSession,
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

export function maintenanceRoutes(app: FastifyInstance): void {
  app.get(
    "/api/maintenance/tickets",
    {
      schema: routeSchema({
        tags: ["maintenance"],
        summary: "List maintenance tickets.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listMaintenanceOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { tickets: overview.tickets });
    },
  );

  app.post(
    "/api/maintenance/tickets",
    {
      schema: routeSchema({
        tags: ["maintenance"],
        summary: "Open a maintenance ticket.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const ticket = await openMaintenanceTicketForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { ticket }, 201);
    },
  );

  app.post(
    "/api/maintenance/tickets/:id/status",
    {
      schema: routeSchema({
        tags: ["maintenance"],
        summary: "Update maintenance ticket status.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const ticket = await updateMaintenanceTicketStatusForSession(
        request.sessionToken,
        id,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { ticket });
    },
  );

  app.get(
    "/api/maintenance/warranties",
    {
      schema: routeSchema({
        tags: ["maintenance"],
        summary: "List warranty records.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listMaintenanceOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { warranties: overview.warranties });
    },
  );

  app.post(
    "/api/maintenance/warranties",
    {
      schema: routeSchema({
        tags: ["maintenance"],
        summary: "Create a warranty record.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const warranty = await createWarrantyForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { warranty }, 201);
    },
  );
}
