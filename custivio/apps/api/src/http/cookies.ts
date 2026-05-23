import { SESSION_COOKIE_NAME } from "@custivio/auth";

import type { AppEnv } from "@custivio/config";
import type { FastifyReply, FastifyRequest } from "fastify";

export function getSessionToken(request: FastifyRequest): string | undefined {
  const cookieValue = request.cookies[SESSION_COOKIE_NAME];

  return typeof cookieValue === "string" && cookieValue.length > 0 ? cookieValue : undefined;
}

function shouldUseSecureCookie(request: FastifyRequest, env: AppEnv): boolean {
  return env.COOKIE_SECURE ?? request.protocol === "https";
}

export function setSessionCookie(
  reply: FastifyReply,
  request: FastifyRequest,
  env: AppEnv,
  value: string,
  expires: Date,
): void {
  reply.setCookie(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request, env),
    path: "/",
    expires,
  });
}

export function clearSessionCookie(
  reply: FastifyReply,
  request: FastifyRequest,
  env: AppEnv,
): void {
  reply.setCookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request, env),
    path: "/",
    maxAge: 0,
  });
}
