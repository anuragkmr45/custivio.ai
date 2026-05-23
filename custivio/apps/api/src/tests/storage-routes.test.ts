import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../app";

import type { FastifyInstance } from "fastify";

describe("Fastify storage routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires auth for asset attachment download", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/assets/asset-id/attachments/attachment-id/download",
      headers: { accept: "application/json" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("accepts multipart upload shape before enforcing auth", async () => {
    const boundary = "----custivio-test-boundary";
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.txt"',
      "Content-Type: text/plain",
      "",
      "hello",
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const response = await app.inject({
      method: "POST",
      url: "/api/assets/asset-id/attachments",
      headers: {
        accept: "application/json",
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    expect(response.statusCode).toBe(401);
  });

  it("requires auth for export download", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/reports/exports/export-id/download",
      headers: { accept: "application/json" },
    });

    expect(response.statusCode).toBe(401);
  });
});
