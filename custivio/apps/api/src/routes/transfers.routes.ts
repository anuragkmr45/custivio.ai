import {
  createTransferRequestForSession,
  decideTransferRequestForSession,
  listCustodyOverview,
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

export function transfersRoutes(app: FastifyInstance): void {
  app.get(
    "/api/transfers",
    {
      schema: routeSchema({
        tags: ["transfers"],
        summary: "List transfer requests visible to the current session.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listCustodyOverview(request.sessionToken);

      return sendJson(reply, request.requestId, { transfers: overview.transfers });
    },
  );

  app.post(
    "/api/transfers",
    {
      schema: routeSchema({
        tags: ["transfers"],
        summary: "Create an asset transfer request.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const transfer = await createTransferRequestForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { transfer }, 201);
    },
  );

  app.post(
    "/api/transfers/:id/decision",
    {
      schema: routeSchema({
        tags: ["transfers"],
        summary: "Approve or reject a transfer request.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const transfer = await decideTransferRequestForSession(
        request.sessionToken,
        id,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { transfer });
    },
  );
}
