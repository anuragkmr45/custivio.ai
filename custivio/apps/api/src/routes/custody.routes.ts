import {
  checkInAssetForSession,
  checkoutAssetForSession,
  handoverAssetForSession,
  listCustodyOverview,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import { readRecordBody } from "../http/validation";
import { createdResponse, jsonResponse, recordBodySchema, routeSchema } from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function custodyRoutes(app: FastifyInstance): void {
  app.get(
    "/api/custody/checkouts",
    {
      schema: routeSchema({
        tags: ["custody"],
        summary: "List custody assignments and movement overview.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listCustodyOverview(request.sessionToken);

      return sendJson(reply, request.requestId, overview);
    },
  );

  app.post(
    "/api/custody/checkouts",
    {
      schema: routeSchema({
        tags: ["custody"],
        summary: "Check an asset out to a custodian.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const assignment = await checkoutAssetForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { assignment }, 201);
    },
  );

  app.post(
    "/api/custody/checkins",
    {
      schema: routeSchema({
        tags: ["custody"],
        summary: "Check an asset back in.",
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const assignment = await checkInAssetForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { assignment });
    },
  );

  app.post(
    "/api/custody/handovers",
    {
      schema: routeSchema({
        tags: ["custody"],
        summary: "Hand over an asset from one custodian to another.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const assignment = await handoverAssetForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { assignment }, 201);
    },
  );
}
