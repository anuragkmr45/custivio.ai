import type { FastifyInstance, FastifySchema } from "fastify";

type JsonSchema = Record<string, unknown>;
type ResponseSchemas = Record<number, JsonSchema>;

const stringId = {
  type: "string",
  minLength: 1,
} as const;

export const emptyObjectSchema = {
  type: "object",
  additionalProperties: false,
} as const satisfies JsonSchema;

export const recordBodySchema = {
  type: "object",
  additionalProperties: true,
} as const satisfies JsonSchema;

export const idParamsSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: stringId,
  },
} as const satisfies JsonSchema;

export const resourceParamsSchema = {
  type: "object",
  required: ["resource"],
  additionalProperties: false,
  properties: {
    resource: stringId,
  },
} as const satisfies JsonSchema;

export const resourceIdParamsSchema = {
  type: "object",
  required: ["resource", "id"],
  additionalProperties: false,
  properties: {
    resource: stringId,
    id: stringId,
  },
} as const satisfies JsonSchema;

export const assetAttachmentParamsSchema = {
  type: "object",
  required: ["id", "attachmentId"],
  additionalProperties: false,
  properties: {
    id: stringId,
    attachmentId: stringId,
  },
} as const satisfies JsonSchema;

export const exportDownloadParamsSchema = {
  type: "object",
  required: ["exportId"],
  additionalProperties: false,
  properties: {
    exportId: stringId,
  },
} as const satisfies JsonSchema;

export const optionalSearchQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string" },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    offset: { type: "integer", minimum: 0 },
  },
} as const satisfies JsonSchema;

export const loginBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tenantSlug: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
  },
} as const satisfies JsonSchema;

export const multipartUploadBodySchema = {
  type: "object",
  required: ["file"],
  additionalProperties: true,
  properties: {
    file: { type: "string", format: "binary" },
  },
} as const satisfies JsonSchema;

function ref(schemaId: string): JsonSchema {
  return { $ref: `${schemaId}#` };
}

export function jsonResponse(schemaId: string): ResponseSchemas {
  return {
    200: ref(schemaId),
    ...standardErrorResponses(),
  };
}

export function createdResponse(schemaId: string): ResponseSchemas {
  return {
    201: ref(schemaId),
    ...standardErrorResponses(),
  };
}

export function fileResponse(description: string): ResponseSchemas {
  return {
    200: {
      description,
      type: "string",
      format: "binary",
    },
    ...standardErrorResponses(),
  };
}

export function standardErrorResponses(): ResponseSchemas {
  return {
    400: ref("ErrorResponse"),
    401: ref("ErrorResponse"),
    403: ref("ErrorResponse"),
    404: ref("ErrorResponse"),
    409: ref("ErrorResponse"),
    429: ref("ErrorResponse"),
    500: ref("ErrorResponse"),
  };
}

export function routeSchema(input: {
  tags: string[];
  summary: string;
  params?: JsonSchema;
  querystring?: JsonSchema;
  body?: JsonSchema;
  response: ResponseSchemas;
}): FastifySchema {
  return input;
}

export function registerOpenApiSchemas(app: FastifyInstance): void {
  app.addSchema({
    $id: "ErrorResponse",
    type: "object",
    required: ["error"],
    additionalProperties: false,
    properties: {
      error: {
        type: "object",
        required: ["code", "message", "requestId"],
        additionalProperties: false,
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          requestId: { type: "string" },
        },
      },
    },
  });

  app.addSchema({
    $id: "OkResponse",
    type: "object",
    required: ["ok"],
    additionalProperties: false,
    properties: {
      ok: { type: "boolean" },
    },
  });

  app.addSchema({
    $id: "GenericObjectResponse",
    type: "object",
    additionalProperties: true,
  });

  app.addSchema({
    $id: "GenericListResponse",
    type: "object",
    additionalProperties: true,
    properties: {
      records: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
    },
  });

  app.addSchema({
    $id: "SessionEnvelope",
    type: "object",
    required: ["session"],
    additionalProperties: false,
    properties: {
      session: ref("SessionDetails"),
    },
  });

  app.addSchema({
    $id: "SessionDetails",
    type: "object",
    required: ["tenant", "user", "permissionKeys", "expiresAt"],
    additionalProperties: true,
    properties: {
      tenant: { type: "object", additionalProperties: true },
      user: { type: "object", additionalProperties: true },
      permissionKeys: { type: "array", items: { type: "string" } },
      expiresAt: { type: "string", format: "date-time" },
    },
  });

  app.addSchema({
    $id: "CurrentSession",
    type: "object",
    required: ["tenant", "user", "permissionKeys", "expiresAt"],
    additionalProperties: false,
    properties: {
      tenant: { type: "object", additionalProperties: true },
      user: { type: "object", additionalProperties: true },
      permissionKeys: { type: "array", items: { type: "string" } },
      expiresAt: { type: "string", format: "date-time" },
    },
  });

  app.addSchema({
    $id: "LiveHealthResponse",
    type: "object",
    required: ["status", "service", "checkedAt", "requestId"],
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: ["ok"] },
      service: { type: "string" },
      checkedAt: { type: "string", format: "date-time" },
      requestId: { type: "string" },
    },
  });

  app.addSchema({
    $id: "ReadinessResponse",
    type: "object",
    required: ["status", "dependencies", "checkedAt", "requestId"],
    additionalProperties: true,
    properties: {
      status: { type: "string", enum: ["ready", "not_ready"] },
      dependencies: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            name: { type: "string" },
            ok: { type: "boolean" },
            latencyMs: { type: "number" },
            error: { type: "string" },
          },
        },
      },
      checkedAt: { type: "string", format: "date-time" },
      requestId: { type: "string" },
    },
  });

  app.addSchema({
    $id: "OpsStatusResponse",
    type: "object",
    required: [
      "service",
      "environment",
      "operationalStatus",
      "dependencies",
      "checkedAt",
      "runbooks",
      "requestId",
    ],
    additionalProperties: false,
    properties: {
      service: { type: "string" },
      environment: { type: "string" },
      operationalStatus: { type: "string" },
      dependencies: { type: "array", items: { type: "object", additionalProperties: true } },
      checkedAt: { type: "string", format: "date-time" },
      runbooks: { type: "object", additionalProperties: { type: "string" } },
      requestId: { type: "string" },
    },
  });
}
