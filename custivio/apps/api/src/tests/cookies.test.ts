import { parseEnv } from "@custivio/config";
import { describe, expect, it, vi } from "vitest";

import { clearSessionCookie, setSessionCookie } from "../http/cookies";

import type { FastifyReply, FastifyRequest } from "fastify";

function createHttpDoubles(): {
  reply: FastifyReply;
  request: FastifyRequest;
  setCookie: ReturnType<typeof vi.fn>;
} {
  const setCookie = vi.fn();

  return {
    reply: { setCookie } as unknown as FastifyReply,
    request: { protocol: "https" } as FastifyRequest,
    setCookie,
  };
}

describe("session cookie configuration", () => {
  it("keeps same-site lax as the local and on-prem default", () => {
    const { reply, request, setCookie } = createHttpDoubles();

    setSessionCookie(reply, request, parseEnv({}), "session-token", new Date("2030-01-01"));

    expect(setCookie).toHaveBeenCalledWith(
      "custivio_session",
      "session-token",
      expect.objectContaining({ sameSite: "lax", secure: true }),
    );
  });

  it("supports secure cross-site cookies for the cloud demo", () => {
    const { reply, request, setCookie } = createHttpDoubles();
    const env = parseEnv({ COOKIE_SAME_SITE: "none", COOKIE_SECURE: "true" });

    setSessionCookie(reply, request, env, "session-token", new Date("2030-01-01"));
    clearSessionCookie(reply, request, env);

    expect(setCookie).toHaveBeenNthCalledWith(
      1,
      "custivio_session",
      "session-token",
      expect.objectContaining({ sameSite: "none", secure: true }),
    );
    expect(setCookie).toHaveBeenNthCalledWith(
      2,
      "custivio_session",
      "",
      expect.objectContaining({ maxAge: 0, sameSite: "none", secure: true }),
    );
  });
});
