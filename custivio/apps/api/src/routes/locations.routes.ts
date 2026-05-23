import {
  archiveLocationForSession,
  createLocationForSession,
  listLocationsForSession,
  updateLocationForSession,
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

export function locationsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/locations/:resource",
    {
      schema: routeSchema({
        tags: ["locations"],
        summary: "List records for a location hierarchy resource.",
        params: resourceParamsSchema,
        response: jsonResponse("GenericListResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const records = await listLocationsForSession(request.sessionToken, resource);

      return sendJson(reply, request.requestId, { records });
    },
  );

  app.post(
    "/api/locations/:resource",
    {
      schema: routeSchema({
        tags: ["locations"],
        summary: "Create a location hierarchy record.",
        params: resourceParamsSchema,
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const record = await createLocationForSession(
        request.sessionToken,
        resource,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record }, 201);
    },
  );

  app.patch(
    "/api/locations/:resource",
    {
      schema: routeSchema({
        tags: ["locations"],
        summary: "Update a location hierarchy record by body id.",
        params: resourceParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const body = readRecordBody(request.body);
      const id = requireParam(body, "id");
      const record = await updateLocationForSession(
        request.sessionToken,
        resource,
        id,
        body,
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record });
    },
  );

  app.patch(
    "/api/locations/:resource/:id",
    {
      schema: routeSchema({
        tags: ["locations"],
        summary: "Update a location hierarchy record by path id.",
        params: resourceIdParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const id = requireParam(request.params, "id");
      const record = await updateLocationForSession(
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
    "/api/locations/:resource",
    {
      schema: routeSchema({
        tags: ["locations"],
        summary: "Archive a location hierarchy record by body id.",
        params: resourceParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const id = requireParam(readRecordBody(request.body), "id");
      const record = await archiveLocationForSession(
        request.sessionToken,
        resource,
        id,
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record });
    },
  );

  app.delete(
    "/api/locations/:resource/:id",
    {
      schema: routeSchema({
        tags: ["locations"],
        summary: "Archive a location hierarchy record by path id.",
        params: resourceIdParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const resource = requireParam(request.params, "resource");
      const id = requireParam(request.params, "id");
      const record = await archiveLocationForSession(
        request.sessionToken,
        resource,
        id,
        request.requestId,
      );

      return sendJson(reply, request.requestId, { record });
    },
  );
}
