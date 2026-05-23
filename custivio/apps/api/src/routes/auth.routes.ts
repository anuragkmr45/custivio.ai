import {
  authenticateWithPassword,
  isAuthError,
  logoutSession,
  requireAuthenticatedSession,
} from "@custivio/auth";
import { checkLoginRateLimit } from "@custivio/core";

import { clearSessionCookie, setSessionCookie } from "../http/cookies";
import { sendJson } from "../http/responses";
import { readRecordBody, readStringField } from "../http/validation";
import {
  jsonResponse,
  loginBodySchema,
  routeSchema,
  standardErrorResponses,
} from "../openapi/schemas";

import type { FastifyInstance, FastifyRequest } from "fastify";

interface LoginFields {
  tenantSlug: string;
  email: string;
  password: string;
}

function wantsJson(request: FastifyRequest): boolean {
  const accept = request.headers.accept;

  return typeof accept === "string" && accept.includes("application/json");
}

function parseLoginFields(request: FastifyRequest): LoginFields {
  const body = readRecordBody(request.body);

  return {
    tenantSlug: readStringField(body, "tenantSlug"),
    email: readStringField(body, "email"),
    password: readStringField(body, "password"),
  };
}

function getClientIp(request: FastifyRequest): string | null {
  const forwardedFor = request.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return raw?.split(",")[0]?.trim() ?? request.ip;
}

function redirectUrl(request: FastifyRequest, path: string): string {
  const host = request.headers.host ?? "localhost";
  const protocol = request.protocol;

  return new URL(path, `${protocol}://${host}`).toString();
}

export function authRoutes(app: FastifyInstance): void {
  app.post(
    "/api/auth/login",
    {
      schema: routeSchema({
        tags: ["auth"],
        summary: "Authenticate with tenant slug, email, and password.",
        body: loginBodySchema,
        response: {
          200: { $ref: "SessionEnvelope#" },
          303: { description: "Redirect response for form clients." },
          ...standardErrorResponses(),
        },
      }),
    },
    async (request, reply) => {
      const fields = parseLoginFields(request);
      const rateLimit = await checkLoginRateLimit({
        tenantSlug: fields.tenantSlug,
        email: fields.email,
        ipAddress: getClientIp(request),
      });

      if (!rateLimit.allowed) {
        reply.header("retry-after", String(rateLimit.retryAfterSeconds));

        if (!wantsJson(request)) {
          return reply.redirect(redirectUrl(request, "/login?error=rate_limited"), 303);
        }

        return sendJson(
          reply,
          request.requestId,
          {
            error: {
              code: "rate_limited",
              message: "Too many sign-in attempts. Try again shortly.",
              requestId: request.requestId,
            },
          },
          429,
        );
      }

      try {
        const result = await authenticateWithPassword({
          ...fields,
          userAgent: request.headers["user-agent"] ?? null,
          ipAddress: getClientIp(request),
          requestId: request.requestId,
        });

        setSessionCookie(
          reply,
          request,
          app.appConfig,
          result.sessionToken,
          result.session.expiresAt,
        );

        if (!wantsJson(request)) {
          return await reply.redirect(redirectUrl(request, "/dashboard"), 303);
        }

        return await sendJson(reply, request.requestId, {
          session: {
            tenant: result.session.tenant,
            user: result.session.user,
            permissionKeys: result.session.permissionKeys,
            expiresAt: result.session.expiresAt.toISOString(),
          },
        });
      } catch (error) {
        if (!wantsJson(request) && isAuthError(error)) {
          return reply
            .header("x-request-id", request.requestId)
            .redirect(redirectUrl(request, `/login?error=${error.code}`), 303);
        }

        throw error;
      }
    },
  );

  app.post(
    "/api/auth/logout",
    {
      schema: routeSchema({
        tags: ["auth"],
        summary: "Destroy the current session and clear the session cookie.",
        response: {
          200: { $ref: "OkResponse#" },
          303: { description: "Redirect response for form clients." },
          ...standardErrorResponses(),
        },
      }),
    },
    async (request, reply) => {
      await logoutSession(request.sessionToken, request.requestId);
      clearSessionCookie(reply, request, app.appConfig);

      if (!wantsJson(request)) {
        return reply.redirect(redirectUrl(request, "/login"), 303);
      }

      return sendJson(reply, request.requestId, { ok: true });
    },
  );

  app.get(
    "/api/auth/me",
    {
      schema: routeSchema({
        tags: ["auth"],
        summary: "Return the current authenticated session.",
        response: jsonResponse("CurrentSession"),
      }),
    },
    async (request, reply) => {
      const session = await requireAuthenticatedSession(request.sessionToken);

      return sendJson(reply, request.requestId, {
        tenant: session.tenant,
        user: session.user,
        permissionKeys: session.permissionKeys,
        expiresAt: session.expiresAt.toISOString(),
      });
    },
  );
}
