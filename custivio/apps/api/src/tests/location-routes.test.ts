import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

describe("Fastify location routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires auth for location reads", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/locations/sites",
      headers: { accept: "application/json" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("supports collection PATCH route shape", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/locations/sites",
      headers: { accept: "application/json" },
      payload: { id: "site-id", name: "Site" },
    });

    expect(response.statusCode).toBe(401);
  });
});
