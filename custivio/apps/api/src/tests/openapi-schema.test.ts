import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

interface OpenApiOperation {
  parameters?: unknown;
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  summary?: unknown;
  tags?: unknown;
}

type OpenApiPathItem = Record<string, OpenApiOperation>;

interface OpenApiSpec {
  components?: {
    schemas?: Record<string, unknown>;
  };
  paths?: Record<string, OpenApiPathItem>;
}

const httpMethods = new Set(["delete", "get", "patch", "post", "put"]);

function getSchemaTitles(spec: OpenApiSpec): Set<string> {
  return new Set(
    Object.values(spec.components?.schemas ?? {}).flatMap((schema) => {
      if (schema && typeof schema === "object" && "title" in schema) {
        const title = (schema as { title?: unknown }).title;

        return typeof title === "string" ? [title] : [];
      }

      return [];
    }),
  );
}

function getOperations(spec: OpenApiSpec): {
  method: string;
  operation: OpenApiOperation;
  path: string;
}[] {
  return Object.entries(spec.paths ?? {}).flatMap(([path, pathItem]) =>
    Object.entries(pathItem)
      .filter(([method]) => httpMethods.has(method))
      .map(([method, operation]) => ({ method, operation, path })),
  );
}

describe("OpenAPI schema contract", () => {
  let app: FastifyInstance;
  let spec: OpenApiSpec;

  beforeAll(async () => {
    app = await buildApiApp();
    const response = await app.inject({ method: "GET", url: "/api/openapi.json" });

    spec = response.json<OpenApiSpec>();
  });

  afterAll(async () => {
    await app.close();
  });

  it("publishes reusable component schemas", () => {
    const schemas = spec.components?.schemas ?? {};
    const titles = getSchemaTitles(spec);

    expect(Object.keys(schemas).length).toBeGreaterThan(5);
    expect(titles.has("ErrorResponse")).toBe(true);
    expect(titles.has("SessionEnvelope")).toBe(true);
    expect(titles.has("ReadinessResponse")).toBe(true);
  });

  it("tags all major backend route groups", () => {
    const tags = new Set(
      getOperations(spec).flatMap(({ operation }) =>
        Array.isArray(operation.tags)
          ? operation.tags.filter((tag) => typeof tag === "string")
          : [],
      ),
    );

    expect(tags.size).toBeGreaterThan(10);

    for (const tag of [
      "admin",
      "assets",
      "audits",
      "auth",
      "catalog",
      "custody",
      "docs",
      "health",
      "imports",
      "locations",
      "maintenance",
      "metrics",
      "ops",
      "reports",
      "stock",
      "transfers",
    ]) {
      expect(tags.has(tag), `missing OpenAPI tag: ${tag}`).toBe(true);
    }
  });

  it("adds summaries, tags, and typed responses to every API operation", () => {
    const operations = getOperations(spec);

    expect(operations.length).toBeGreaterThan(30);

    for (const { method, operation, path } of operations) {
      expect(typeof operation.summary, `${method.toUpperCase()} ${path} missing summary`).toBe(
        "string",
      );
      expect(Array.isArray(operation.tags), `${method.toUpperCase()} ${path} missing tags`).toBe(
        true,
      );
      expect(operation.responses, `${method.toUpperCase()} ${path} missing responses`).toBeTruthy();
      expect(
        Object.keys(operation.responses ?? {}).some((status) =>
          ["200", "201", "303"].includes(status),
        ),
        `${method.toUpperCase()} ${path} missing success response`,
      ).toBe(true);
      expect(
        Object.keys(operation.responses ?? {}).includes("500"),
        `${method.toUpperCase()} ${path} missing typed 500 response`,
      ).toBe(true);
    }
  });

  it("documents representative params, request bodies, and download responses", () => {
    const paths = spec.paths ?? {};
    const assetListOperation = paths["/api/assets"]?.get as { parameters?: unknown } | undefined;
    const assetListParams = Array.isArray(assetListOperation?.parameters)
      ? (assetListOperation.parameters as { name?: unknown }[])
      : [];
    const assetListParamNames = assetListParams.map((param) => param.name);

    expect(assetListParamNames).toEqual(expect.arrayContaining(["q", "limit", "offset"]));
    expect(paths["/api/assets/{id}"]?.get?.parameters).toBeTruthy();
    expect(paths["/api/assets"]?.post?.requestBody).toBeTruthy();
    expect(paths["/api/auth/login"]?.post?.requestBody).toBeTruthy();
    expect(paths["/api/assets/{id}/attachments"]?.post?.requestBody).toBeTruthy();
    expect(
      paths["/api/assets/{id}/attachments/{attachmentId}/download"]?.get?.responses?.["200"],
    ).toBeTruthy();
    expect(paths["/api/reports/exports/{exportId}/download"]?.get?.responses?.["200"]).toBeTruthy();
  });
});
