import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

describe("Fastify admin mutation routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires auth for user creation", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      headers: { accept: "application/json" },
      payload: {},
    });

    expect(response.statusCode).toBe(401);
  });

  it("requires auth for role assignment creation", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/assignments",
      headers: { accept: "application/json" },
      payload: {},
    });

    expect(response.statusCode).toBe(401);
  });
});
