# Reusable Backend Code For Fastify Migration

This file classifies current code by how it should be handled during a later Next.js API to Fastify migration. No code is moved by this plan.

## Keep Unchanged

| Code                                                        | Evidence                                                                                                                                                                                     | Reason                                                                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/db`                                               | `packages/db/src/schema/*.ts`, `packages/db/src/repositories/*.ts`, `packages/db/src/migrations/*.sql`, `packages/db/src/client.ts`, `packages/db/src/migrate.ts`, `packages/db/src/seed.ts` | Drizzle/PostgreSQL package is framework-independent and already owns schema, repositories, migrations, migration runner, and seed.        |
| `packages/core` business services                           | `packages/core/src/assets/asset-service.ts`, `catalog/catalog-service.ts`, `stock/stock-service.ts`, `operations/operations-service.ts`, `reporting/reporting-service.ts`, `health.ts`       | Services already sit behind route handlers and enforce permission, tenant scope, validation, audit logs, and repository access.           |
| `packages/auth` session core                                | `packages/auth/src/sessions.ts`, `packages/auth/src/passwords.ts`, `packages/auth/src/errors.ts`                                                                                             | Password auth, session token hashing, permission checks, and admin list functions are framework-independent except route/cookie adapters. |
| `packages/config`                                           | `packages/config/src/index.ts`                                                                                                                                                               | Centralized Zod env validation and only package reading `process.env`.                                                                    |
| `packages/telemetry` primitives                             | `packages/telemetry/src/logger.ts`, `metrics.ts`, `request-id.ts`                                                                                                                            | Structured logger, Prometheus registry, and request ID helper are framework-independent.                                                  |
| `infra/docker-compose.dev.yml` and dev observability config | `infra/docker-compose.dev.yml`, `infra/prometheus/prometheus.yml`, `infra/grafana/**`, `infra/otel/collector-config.yml`, `infra/minio/init-bucket.sh`                                       | Dev PostgreSQL, Valkey, MinIO, Mailpit, OTel, Prometheus, and Grafana remain valid.                                                       |
| Integration tests around packages                           | `tests/integration/*.test.ts`                                                                                                                                                                | Existing package/service integration tests should continue to run during migration.                                                       |

## Move To Shared Backend API Code

| Code                               | Current location                                              | Target location                                                  | Reason                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| API error mapping                  | `apps/web/lib/api/responses.ts`                               | `apps/api/src/http/responses.ts` or a future shared HTTP package | Current logic maps domain errors to the public API error shape. Only `NextResponse` must be replaced with Fastify replies.  |
| Request JSON object parsing helper | Repeated in many route files                                  | `apps/api/src/http/validation.ts`                                | Routes repeatedly parse unknown JSON into `Record<string, unknown>`. Centralize the equivalent for Fastify.                 |
| Session cookie extraction          | Repeated as `request.cookies.get(SESSION_COOKIE_NAME)?.value` | `apps/api/src/http/cookies.ts` or `auth.plugin.ts`               | Fastify should expose a typed `request.sessionToken` or helper to keep route handlers thin.                                 |
| Permission route helpers           | Current permission calls are inside services                  | `apps/api/src/http/permissions.ts` only for route metadata/docs  | Permission enforcement should stay in services; HTTP helpers should exist only for OpenAPI metadata and optional preflight. |
| OpenAPI response schemas           | Currently documented in `docs/engineering/API_CONTRACT.md`    | `apps/api/src/http/openapi-schemas.ts` or route-local schemas    | Fastify target should generate API docs while preserving existing shapes.                                                   |

## Port To Fastify Routes

| Current code                                             | Target                                                                           | Notes                                                                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/api/auth/login/route.ts`                   | `apps/api/src/routes/auth.routes.ts`                                             | Preserve JSON/form parsing, rate-limit behavior, cookie creation, 303 redirects for form clients, and `retry-after`. |
| `apps/web/app/api/auth/logout/route.ts`                  | `apps/api/src/routes/auth.routes.ts`                                             | Preserve JSON versus redirect behavior and cookie clearing.                                                          |
| `apps/web/app/api/auth/me/route.ts`                      | `apps/api/src/routes/auth.routes.ts`                                             | Preserve session response shape and `expiresAt` ISO serialization.                                                   |
| `apps/web/app/api/admin/**`                              | `apps/api/src/routes/admin.routes.ts`                                            | Port list routes first. Mutation routes are blocker work, not parity work.                                           |
| `apps/web/app/api/catalog/**`                            | `apps/api/src/routes/catalog.routes.ts`                                          | Preserve `{ records }`, `{ record }`, status codes, and resource names.                                              |
| `apps/web/app/api/assets/**`                             | `apps/api/src/routes/assets.routes.ts`                                           | Multipart upload needs `@fastify/multipart`. Add missing download/delete in blocker phase.                           |
| `apps/web/app/api/stock/**`                              | `apps/api/src/routes/stock.routes.ts`                                            | Preserve overview response from GET `/api/stock/items`. Improve idempotency later.                                   |
| `apps/web/app/api/custody/**`                            | `apps/api/src/routes/custody.routes.ts`                                          | Preserve overview response from GET `/api/custody/checkouts`.                                                        |
| `apps/web/app/api/transfers/**`                          | `apps/api/src/routes/transfers.routes.ts`                                        | Preserve `/api/transfers/{id}/decision`.                                                                             |
| `apps/web/app/api/maintenance/**`                        | `apps/api/src/routes/maintenance.routes.ts`                                      | Preserve tickets and warranties shapes.                                                                              |
| `apps/web/app/api/audits/**`, `imports/**`, `reports/**` | `apps/api/src/routes/audits.routes.ts`, `imports.routes.ts`, `reports.routes.ts` | Preserve current combined overview permission behavior first, then improve only after parity.                        |
| `apps/web/app/api/health/**`, `metrics`, `ops/status`    | `apps/api/src/routes/health.routes.ts`, `metrics.routes.ts`, `ops.routes.ts`     | Preserve public status semantics and Prometheus text content type.                                                   |

## Delete After Parity

Delete only after Fastify route-contract tests pass against all 46 existing method endpoints and frontend integration uses the Fastify backend.

| Code                                             | Delete condition                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/api/**`                            | All paths and response shapes are implemented and tested in `apps/api`.                                               |
| `apps/web/lib/api/responses.ts`                  | Equivalent Fastify response helper is in place and tests verify error shape/status/header parity.                     |
| `apps/web/lib/auth/session.ts`                   | Frontend page rendering is removed from this repo or replaced by external frontend; backend uses Fastify auth plugin. |
| `apps/web/middleware.ts`                         | Backend is no longer responsible for Next page redirect middleware.                                                   |
| `apps/web/next.config.mjs`                       | Security headers are moved to Fastify and no Next build remains.                                                      |
| `apps/web` package scripts and Next dependencies | `apps/api` build/start/check scripts fully replace them.                                                              |
| UI-only dependencies                             | Delete after confirming backend docs/tests do not import React, Next, Tailwind, Radix, or shadcn UI code.             |

## Rewrite Because Next-Specific

| Code                                                                  | Why it must be rewritten                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NextRequest` and `NextResponse` usage in `apps/web/app/api/**`       | Fastify uses `FastifyRequest` and `FastifyReply`; response helpers must call `reply.status().headers().send()`.                                                                           |
| `cookies()` from `next/headers` in `apps/web/lib/auth/session.ts`     | Fastify should use `@fastify/cookie` and a request decoration/hook.                                                                                                                       |
| `redirect()` from `next/navigation` in `apps/web/lib/auth/session.ts` | API backend should return JSON/HTTP errors; browser page redirects are frontend responsibility except existing auth form redirects preserved in `/api/auth/login` and `/api/auth/logout`. |
| `request.nextUrl` usage                                               | Fastify uses URL parsing from `request.url`, `request.query`, and server config for redirect origins.                                                                                     |
| `request.formData()` and `File` in upload route                       | Fastify multipart uses stream/file parts and must avoid unbounded memory buffering.                                                                                                       |
| Next middleware route protection                                      | Fastify route auth is implemented as hooks/plugins; frontend page route protection is out of backend scope after migration.                                                               |
| Next security headers in `next.config.mjs`                            | Move to Fastify security plugin, likely `@fastify/helmet`, or explicit response hooks.                                                                                                    |

## Complete Before Migration Or During Blocker Phase

| Area                          | Current evidence                                                                    | Needed before backend can be called ship-ready                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Storage download/delete       | `packages/storage/src/minio-client.ts` exposes `putObject` only                     | Add get/presign/delete helpers, typed storage errors, attachment authorization, and route tests.           |
| Valkey locks/idempotency/jobs | `packages/cache/src/rate-limit.ts` only implements rate limit                       | Add lock, idempotency, and queue primitives; use them for imports/exports/stock where applicable.          |
| Admin mutations               | `apps/web/app/api/admin/**` are GET-only                                            | Add user, role, assignment, password reset, disable/enable APIs and tests.                                 |
| Locations API                 | `packages/db/src/repositories/locations.repository.ts` exists but no core/API route | Add location service and `/api/locations/**` endpoints.                                                    |
| Production packaging          | `infra/docker-compose.dev.yml` exists only for dev                                  | Add `Dockerfile.api`, production Compose, env templates, offline build notes, backup/restore verification. |
