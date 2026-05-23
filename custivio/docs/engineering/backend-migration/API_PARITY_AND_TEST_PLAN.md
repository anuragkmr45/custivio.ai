# API Parity And Test Plan

Goal: prove the Fastify backend preserves current Next.js API behavior before deleting any Next.js code.

## Parity Scope

Must preserve:

- 33 current route files represented as 46 HTTP method endpoints.
- `/api` path prefix.
- `custivio_session` cookie name and session semantics.
- Existing success response wrappers and status codes.
- Existing handled error shape.
- `x-request-id` header and error body field.
- Public health, readiness, metrics, and ops routes.
- Auth login/logout JSON and non-JSON redirect behavior.

Out of parity scope:

- Frontend pages/components/layouts.
- Visual UI behavior.
- New blocker APIs, except where explicitly added after parity.

## Route Contract Test Strategy

Create tests under:

```text
apps/api/src/tests/route-contract/
```

Use Fastify app injection for deterministic tests:

- Build app through `apps/api/src/app.ts`.
- Seed test database through existing DB seed helpers.
- Authenticate test users through real `POST /api/auth/login` or direct package test helpers.
- Assert status code, JSON body shape, headers, and cookie behavior.
- Assert unauthorized and forbidden paths for protected endpoints.
- Assert route handlers do not expose raw DB/storage errors.

## Required Test Areas

| Test area            | Required coverage                                                                              | Evidence to preserve                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Health               | `/api/health/live`, `/api/health/ready` 200/503 behavior                                       | `apps/web/app/api/health/**`, `packages/core/src/health.ts`              |
| Metrics              | `/api/metrics` content type and text body                                                      | `apps/web/app/api/metrics/route.ts`, `packages/telemetry/src/metrics.ts` |
| Ops                  | `/api/ops/status` body and 200/503 status                                                      | `apps/web/app/api/ops/status/route.ts`                                   |
| Auth/session cookies | login JSON, login form redirect, logout JSON, logout redirect, `me`, invalid login, rate limit | `apps/web/app/api/auth/**`, `packages/auth/src/sessions.ts`              |
| Permissions          | allow/deny by permission key for each protected area                                           | `packages/auth/src/sessions.ts`, service tests                           |
| Tenant isolation     | same user/data IDs cannot cross tenant                                                         | `packages/db/src/repositories/*`, integration tests                      |
| Catalog              | list/create/update/archive every resource type                                                 | `tests/integration/catalog.test.ts`                                      |
| Assets               | list/create/detail/update/lifecycle/upload                                                     | `tests/integration/assets.test.ts`                                       |
| Storage blocker      | upload/download/delete after blocker implementation                                            | `packages/storage/src/minio-client.ts`                                   |
| Stock                | overview/unit/item/movement and idempotency after blocker implementation                       | `tests/integration/stock.test.ts`                                        |
| Custody/transfers    | checkouts/checkins/handovers/transfer create/decision                                          | `tests/integration/operations.test.ts`                                   |
| Maintenance          | tickets/status/warranties                                                                      | `tests/integration/operations.test.ts`                                   |
| Reporting            | audit campaigns/scans, import preview/process, exports, filters                                | `tests/integration/reporting.test.ts`                                    |
| Valkey blockers      | locks, idempotency, queues/jobs after blocker implementation                                   | `packages/cache/src/rate-limit.ts` shows only rate limit today           |
| OpenAPI              | generated spec includes all stable routes and schemas                                          | new Fastify swagger plugin                                               |
| Docker production    | production image builds and health checks pass                                                 | new production packaging                                                 |

## Current Next Route To Fastify Route Mapping

| Current Next source                                         | Methods       | Fastify module          | Path(s)                               |
| ----------------------------------------------------------- | ------------- | ----------------------- | ------------------------------------- |
| `apps/web/app/api/admin/users/route.ts`                     | GET           | `admin.routes.ts`       | `/api/admin/users`                    |
| `apps/web/app/api/admin/roles/route.ts`                     | GET           | `admin.routes.ts`       | `/api/admin/roles`                    |
| `apps/web/app/api/admin/assignments/route.ts`               | GET           | `admin.routes.ts`       | `/api/admin/assignments`              |
| `apps/web/app/api/assets/route.ts`                          | GET, POST     | `assets.routes.ts`      | `/api/assets`                         |
| `apps/web/app/api/assets/[id]/route.ts`                     | GET, PATCH    | `assets.routes.ts`      | `/api/assets/:id`                     |
| `apps/web/app/api/assets/[id]/attachments/route.ts`         | POST          | `assets.routes.ts`      | `/api/assets/:id/attachments`         |
| `apps/web/app/api/assets/[id]/lifecycle/route.ts`           | POST          | `assets.routes.ts`      | `/api/assets/:id/lifecycle`           |
| `apps/web/app/api/audits/campaigns/route.ts`                | GET, POST     | `audits.routes.ts`      | `/api/audits/campaigns`               |
| `apps/web/app/api/audits/scans/route.ts`                    | POST          | `audits.routes.ts`      | `/api/audits/scans`                   |
| `apps/web/app/api/auth/login/route.ts`                      | POST          | `auth.routes.ts`        | `/api/auth/login`                     |
| `apps/web/app/api/auth/logout/route.ts`                     | POST          | `auth.routes.ts`        | `/api/auth/logout`                    |
| `apps/web/app/api/auth/me/route.ts`                         | GET           | `auth.routes.ts`        | `/api/auth/me`                        |
| `apps/web/app/api/catalog/[resource]/route.ts`              | GET, POST     | `catalog.routes.ts`     | `/api/catalog/:resource`              |
| `apps/web/app/api/catalog/[resource]/[id]/route.ts`         | PATCH, DELETE | `catalog.routes.ts`     | `/api/catalog/:resource/:id`          |
| `apps/web/app/api/custody/checkouts/route.ts`               | GET, POST     | `custody.routes.ts`     | `/api/custody/checkouts`              |
| `apps/web/app/api/custody/checkins/route.ts`                | POST          | `custody.routes.ts`     | `/api/custody/checkins`               |
| `apps/web/app/api/custody/handovers/route.ts`               | POST          | `custody.routes.ts`     | `/api/custody/handovers`              |
| `apps/web/app/api/health/live/route.ts`                     | GET           | `health.routes.ts`      | `/api/health/live`                    |
| `apps/web/app/api/health/ready/route.ts`                    | GET           | `health.routes.ts`      | `/api/health/ready`                   |
| `apps/web/app/api/imports/jobs/route.ts`                    | GET, POST     | `imports.routes.ts`     | `/api/imports/jobs`                   |
| `apps/web/app/api/imports/jobs/[id]/process/route.ts`       | POST          | `imports.routes.ts`     | `/api/imports/jobs/:id/process`       |
| `apps/web/app/api/maintenance/tickets/route.ts`             | GET, POST     | `maintenance.routes.ts` | `/api/maintenance/tickets`            |
| `apps/web/app/api/maintenance/tickets/[id]/status/route.ts` | POST          | `maintenance.routes.ts` | `/api/maintenance/tickets/:id/status` |
| `apps/web/app/api/maintenance/warranties/route.ts`          | GET, POST     | `maintenance.routes.ts` | `/api/maintenance/warranties`         |
| `apps/web/app/api/metrics/route.ts`                         | GET           | `metrics.routes.ts`     | `/api/metrics`                        |
| `apps/web/app/api/ops/status/route.ts`                      | GET           | `ops.routes.ts`         | `/api/ops/status`                     |
| `apps/web/app/api/reports/exports/route.ts`                 | GET, POST     | `reports.routes.ts`     | `/api/reports/exports`                |
| `apps/web/app/api/reports/filters/route.ts`                 | GET, POST     | `reports.routes.ts`     | `/api/reports/filters`                |
| `apps/web/app/api/stock/items/route.ts`                     | GET, POST     | `stock.routes.ts`       | `/api/stock/items`                    |
| `apps/web/app/api/stock/movements/route.ts`                 | POST          | `stock.routes.ts`       | `/api/stock/movements`                |
| `apps/web/app/api/stock/units/route.ts`                     | POST          | `stock.routes.ts`       | `/api/stock/units`                    |
| `apps/web/app/api/transfers/route.ts`                       | GET, POST     | `transfers.routes.ts`   | `/api/transfers`                      |
| `apps/web/app/api/transfers/[id]/decision/route.ts`         | POST          | `transfers.routes.ts`   | `/api/transfers/:id/decision`         |

## Verification Commands

Run after each implementation phase:

```bash
pnpm check:forbidden
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Run when DB or seed changes:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:seed
RUN_DB_TESTS=1 pnpm test
```

Run when infrastructure changes:

```bash
pnpm docker:dev
pnpm build
```

Run when Fastify server exists:

```bash
pnpm --filter @custivio/api test
pnpm --filter @custivio/api build
curl -sS http://127.0.0.1:3000/api/health/live
curl -sS http://127.0.0.1:3000/api/health/ready
curl -sS http://127.0.0.1:3000/api/metrics
```

The API port may change during implementation. If it changes, update docs and external frontend configuration.

## Parity Acceptance Criteria

- Every row in `NEXT_API_ROUTE_INVENTORY.md` has a Fastify route test.
- Existing package integration tests still pass.
- Auth cookie behavior is byte-level close enough for browser clients: cookie name, path, expiry, `httpOnly`, same-site behavior, secure behavior.
- JSON error shape is unchanged.
- Route paths are unchanged from the frontend perspective.
- OpenAPI spec is generated and includes all stable endpoints.
- No forbidden dependency is introduced.
- Next.js remains present until explicit removal phase.
