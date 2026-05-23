import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import fp from "fastify-plugin";

export const securityPlugin = fp(async (app) => {
  const origins = app.appConfig.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cookie);
  await app.register(formbody);
  await app.register(cors, {
    credentials: true,
    exposedHeaders: ["retry-after", "x-request-id"],
    allowedHeaders: ["accept", "content-type", "idempotency-key"],
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    origin: origins.length > 0 ? origins : false,
  });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  });

  app.addHook("onSend", async (_request, reply) => {
    reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  });
});
