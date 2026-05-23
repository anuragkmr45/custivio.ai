import {
  createStockItemForSession,
  createStockUnitForSession,
  listStockOverview,
  recordStockMovementForSession,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import { readRecordBody } from "../http/validation";
import { createdResponse, jsonResponse, recordBodySchema, routeSchema } from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function stockRoutes(app: FastifyInstance): void {
  app.get(
    "/api/stock/items",
    {
      schema: routeSchema({
        tags: ["stock"],
        summary: "List stock items, balances, and related stock overview data.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const overview = await listStockOverview(request.sessionToken);

      return sendJson(reply, request.requestId, overview);
    },
  );

  app.post(
    "/api/stock/items",
    {
      schema: routeSchema({
        tags: ["stock"],
        summary: "Create a stock item.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const item = await createStockItemForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { item }, 201);
    },
  );

  app.post(
    "/api/stock/units",
    {
      schema: routeSchema({
        tags: ["stock"],
        summary: "Create a stock unit of measure.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const unit = await createStockUnitForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { unit }, 201);
    },
  );

  app.post(
    "/api/stock/movements",
    {
      schema: routeSchema({
        tags: ["stock"],
        summary: "Record a stock ledger movement.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const ledger = await recordStockMovementForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { ledger }, 201);
    },
  );
}
