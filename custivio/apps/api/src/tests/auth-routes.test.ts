import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

describe("Fastify auth routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns typed JSON login error for invalid input", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { accept: "application/json" },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "invalid_credentials",
      },
    });
  });

  it("clears session cookie on JSON logout", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { accept: "application/json" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    expect(response.headers["set-cookie"]).toBeTruthy();
  });

  it("requires auth for current session", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { accept: "application/json" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "missing_session",
      },
    });
  });
});
