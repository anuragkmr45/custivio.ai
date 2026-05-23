# Target Fastify Architecture

Mission: replace Next.js API route handlers with a pure Node.js Fastify backend while preserving current API paths and response shapes. This document is a plan only.

## Target Repository Shape

```text
custivio/
  apps/
    api/
      package.json
      tsconfig.json
      src/
        app.ts
        server.ts
        plugins/
          config.plugin.ts
          logger.plugin.ts
          request-id.plugin.ts
          auth.plugin.ts
          metrics.plugin.ts
          error.plugin.ts
          multipart.plugin.ts
          rate-limit.plugin.ts
          swagger.plugin.ts
        routes/
          health.routes.ts
          metrics.routes.ts
          auth.routes.ts
          admin.routes.ts
          catalog.routes.ts
          assets.routes.ts
          locations.routes.ts
          stock.routes.ts
          custody.routes.ts
          transfers.routes.ts
          maintenance.routes.ts
          audits.routes.ts
          imports.routes.ts
          reports.routes.ts
          files.routes.ts
          ops.routes.ts
        http/
          responses.ts
          errors.ts
          cookies.ts
          validation.ts
          permissions.ts
          openapi-schemas.ts
        tests/
          route-contract/
  packages/
    db/
    core/
    auth/
    storage/
    cache/
    config/
    telemetry/
  infra/
    docker-compose.dev.yml
    docker-compose.prod.yml
    Dockerfile.api
```

## Package Retention Decision

Keep these packages and keep their ownership boundaries:

- `packages/db`: Drizzle schema, repositories, migrations, seed, PostgreSQL client.
- `packages/core`: business workflows and domain validation.
- `packages/auth`: password auth, sessions, permission checks, user/role helpers.
- `packages/storage`: MinIO/S3 client, object keys, storage policies.
- `packages/cache`: Valkey client, rate limits, future locks/idempotency/queue helpers.
- `packages/config`: Zod env validation and all `process.env` access.
- `packages/telemetry`: logger, request IDs, Prometheus metrics, tracing.

## Fastify Application Responsibilities

`apps/api/src/app.ts`:

- Build and return the Fastify app instance.
- Register plugins in deterministic order.
- Register all route modules under `/api`.
- Expose an app factory for tests without binding a port.

`apps/api/src/server.ts`:

- Load validated config through `@custivio/config`.
- Start the HTTP server.
- Handle shutdown signals.
- Close database/cache/storage resources if package APIs expose closers.

## Plugin Responsibilities

| Plugin                 | Responsibility                                                                  | Source behavior to preserve                                                            |
| ---------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `config.plugin.ts`     | Decorate app with validated env/config                                          | `packages/config/src/index.ts` remains the only env reader.                            |
| `logger.plugin.ts`     | Bridge Fastify request logs to `packages/telemetry` logger                      | Current `logger.error` behavior in `apps/web/lib/api/responses.ts`.                    |
| `request-id.plugin.ts` | Read or generate `x-request-id`; attach to request and response                 | `createRequestId` in `packages/telemetry/src/request-id.ts`.                           |
| `auth.plugin.ts`       | Parse `custivio_session`, expose auth/session helpers, support protected routes | Repeated `request.cookies.get(SESSION_COOKIE_NAME)?.value`.                            |
| `metrics.plugin.ts`    | Register route timing/status metrics and expose registry                        | Current `/api/metrics` uses `renderMetrics`.                                           |
| `error.plugin.ts`      | Convert known domain errors into the public error shape                         | `toErrorResponse` in `apps/web/lib/api/responses.ts`.                                  |
| `multipart.plugin.ts`  | Register upload handling with limits                                            | `apps/web/app/api/assets/[id]/attachments/route.ts`, improved with size/MIME controls. |
| `rate-limit.plugin.ts` | HTTP-level rate-limit hook where needed                                         | Login currently calls `checkLoginRateLimit` in core. Preserve behavior first.          |
| `swagger.plugin.ts`    | Generate OpenAPI docs for all stable `/api` routes                              | `docs/engineering/API_CONTRACT.md` becomes executable contract metadata.               |

## Route Modules

| Fastify route module    | Current Next.js source                                           | Notes                                                                  |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `health.routes.ts`      | `apps/web/app/api/health/live/route.ts`, `health/ready/route.ts` | Public JSON routes.                                                    |
| `metrics.routes.ts`     | `apps/web/app/api/metrics/route.ts`                              | Public Prometheus text route.                                          |
| `ops.routes.ts`         | `apps/web/app/api/ops/status/route.ts`                           | Public operational readiness route.                                    |
| `auth.routes.ts`        | `apps/web/app/api/auth/**`                                       | Highest parity risk because of cookies, redirects, JSON/form behavior. |
| `admin.routes.ts`       | `apps/web/app/api/admin/**`                                      | Port GET list endpoints first, then add blocker mutation APIs.         |
| `catalog.routes.ts`     | `apps/web/app/api/catalog/**`                                    | Dynamic `resource` and `id` path params.                               |
| `assets.routes.ts`      | `apps/web/app/api/assets/**`                                     | Multipart upload and future file endpoints.                            |
| `stock.routes.ts`       | `apps/web/app/api/stock/**`                                      | Preserve stock overview shape.                                         |
| `custody.routes.ts`     | `apps/web/app/api/custody/**`                                    | Preserve custody overview shape.                                       |
| `transfers.routes.ts`   | `apps/web/app/api/transfers/**`                                  | Preserve transfer decision route.                                      |
| `maintenance.routes.ts` | `apps/web/app/api/maintenance/**`                                | Tickets, status changes, warranties.                                   |
| `audits.routes.ts`      | `apps/web/app/api/audits/**`                                     | Preserve current reporting overview permission behavior first.         |
| `imports.routes.ts`     | `apps/web/app/api/imports/**`                                    | Port preview/process first, then move processing to jobs.              |
| `reports.routes.ts`     | `apps/web/app/api/reports/**`                                    | Port export/filter APIs first, then add export download.               |
| `locations.routes.ts`   | No current Next route                                            | New blocker work backed by existing DB repositories.                   |
| `files.routes.ts`       | No current download/delete route                                 | New blocker work for authorized file retrieval/deletion.               |

## Dependency Plan

Add only during implementation, not during this planning task:

- `fastify`
- `@fastify/cookie`
- `@fastify/multipart`
- `@fastify/swagger`
- `@fastify/swagger-ui`
- `@fastify/helmet` or equivalent explicit security-header hooks
- `@fastify/cors` only if frontend origin separation requires it

Do not add forbidden dependencies:

- Prisma or `@prisma/client`
- Supabase runtime
- Firebase
- MongoDB/Mongoose
- Neon/serverless-only runtime
- paid SaaS dependencies for core operations

## API Stability Rules

During parity migration:

- Preserve all 46 current method endpoints.
- Preserve the `/api` prefix.
- Preserve `custivio_session` cookie name and semantics.
- Preserve success response wrappers such as `{ asset }`, `{ records }`, `{ error }`.
- Preserve status codes, including `201` on creates and `503` readiness when dependencies fail.
- Preserve `x-request-id` on success and handled error responses.
- Preserve public health, metrics, and ops routes.
- Preserve login/logout redirect behavior for non-JSON clients unless explicitly deprecated later.

## Implementation Phases

1. **Fastify foundation**
   - Create `apps/api` with app factory, server entry, config/logger/request-id/error plugins.
   - Add package scripts without deleting Next.
   - Add smoke route tests for `/api/health/live`, `/api/health/ready`, `/api/metrics`.

2. **Auth/session parity**
   - Implement cookie plugin and auth route module.
   - Port login/logout/me with exact JSON/form/redirect behavior.
   - Add cookie, rate-limit, invalid-login, inactive-user, and current-session tests.

3. **Core route parity**
   - Port admin list, catalog, assets, stock, custody, transfers, maintenance, audits, imports, reports, ops.
   - Add route-contract tests for every method endpoint.

4. **Backend blocker completion**
   - Implement file download/delete, Valkey locks/idempotency/jobs, admin mutations, locations API, production packaging.

5. **OpenAPI and deployment**
   - Generate OpenAPI docs.
   - Add production Dockerfile and Compose.
   - Update Prometheus scrape config and Grafana dashboards if port/service labels change.

6. **Next removal**
   - Remove Next only after API parity and frontend decoupling are proven.

## Readiness Target

After phases 1 to 5, backend/db/infra readiness should be high enough for external frontend development and staging validation. Next removal is a cleanup phase, not a prerequisite for Fastify route parity.
