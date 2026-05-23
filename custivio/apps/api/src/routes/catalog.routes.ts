import {
  archiveCatalogResource,
  createCatalogResource,
  listCatalogResource,
  updateCatalogResource,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import { readRecordBody, requireParam } from "../http/validation";
import {
  createdResponse,
  jsonResponse,
  recordBodySchema,
  resourceIdParamsSchema,
  resourceParamsSchema,
  routeSchema,
} from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function catalogRoutes(app: FastifyInstance): void {
  app.get(
    "/api/catalog/:resource",
    {
      schema: routeSchema({
        tags: ["catalog"],
        summary: "List records for a catalog resource.",
        params: resourceParamsSchema,
        response: jsonResponse("GenericListResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const records = await listCatalogResource(request.sessionToken, resource);

      return sendJson(reply, request.requestId, { records });
    },
  );

  app.post(
    "/api/catalog/:resource",
    {
      schema: routeSchema({
        tags: ["catalog"],
        summary: "Create a catalog record.",
        params: resourceParamsSchema,
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const record = await createCatalogResource(
        request.sessionToken,
        resource,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record }, 201);
    },
  );

  app.patch(
    "/api/catalog/:resource/:id",
    {
      schema: routeSchema({
        tags: ["catalog"],
        summary: "Update a catalog record.",
        params: resourceIdParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const id = requireParam(request.params, "id");
      const record = await updateCatalogResource(
        request.sessionToken,
        resource,
        id,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record });
    },
  );

  app.delete(
    "/api/catalog/:resource/:id",
    {
      schema: routeSchema({
        tags: ["catalog"],
        summary: "Archive a catalog record.",
        params: resourceIdParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const id = requireParam(request.params, "id");
      const record = await archiveCatalogResource(
        request.sessionToken,
        resource,
        id,
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record });
    },
  );
}
