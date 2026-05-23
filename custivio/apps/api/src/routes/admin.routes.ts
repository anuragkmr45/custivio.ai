import {
  assignRoleForSession,
  createRoleForSession,
  createUserForSession,
  disableUserForSession,
  listAssignmentsForSession,
  listRolesForSession,
  listUsersForSession,
  removeRoleAssignmentForSession,
  resetUserPasswordForSession,
  updateRoleForSession,
  updateUserForSession,
} from "@custivio/auth";

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

export function adminRoutes(app: FastifyInstance): void {
  app.get(
    "/api/admin/users",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "List tenant users visible to the current admin session.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const users = await listUsersForSession(request.sessionToken);

      return sendJson(reply, request.requestId, {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          jobTitle: user.jobTitle,
        })),
      });
    },
  );

  app.post(
    "/api/admin/users",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Create a user in the current tenant.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const user = await createUserForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { user }, 201);
    },
  );

  app.patch(
    "/api/admin/users/:id",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Update a tenant user.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const user = await updateUserForSession(
        request.sessionToken,
        requireParam(request.params, "id"),
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { user });
    },
  );

  app.post(
    "/api/admin/users/:id/reset-password",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Reset a tenant user's password.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const result = await resetUserPasswordForSession(
        request.sessionToken,
        requireParam(request.params, "id"),
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, result);
    },
  );

  app.post(
    "/api/admin/users/:id/disable",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Disable a tenant user.",
        params: idParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const user = await disableUserForSession(
        request.sessionToken,
        requireParam(request.params, "id"),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { user });
    },
  );

  app.get(
    "/api/admin/roles",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "List tenant roles.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const roles = await listRolesForSession(request.sessionToken);

      return sendJson(reply, request.requestId, { roles });
    },
  );

  app.post(
    "/api/admin/roles",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Create a tenant role.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const role = await createRoleForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { role }, 201);
    },
  );

  app.patch(
    "/api/admin/roles/:id",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Update a tenant role.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const role = await updateRoleForSession(
        request.sessionToken,
        requireParam(request.params, "id"),
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { role });
    },
  );

  app.get(
    "/api/admin/assignments",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "List tenant role assignments.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const assignments = await listAssignmentsForSession(request.sessionToken);

      return sendJson(reply, request.requestId, { assignments });
    },
  );

  app.post(
    "/api/admin/assignments",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Assign a role to a tenant user.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const assignment = await assignRoleForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { assignment }, 201);
    },
  );

  app.delete(
    "/api/admin/assignments/:id",
    {
      schema: routeSchema({
        tags: ["admin"],
        summary: "Remove a role assignment.",
        params: idParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const assignment = await removeRoleAssignmentForSession(
        request.sessionToken,
        requireParam(request.params, "id"),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { assignment });
    },
  );
}
