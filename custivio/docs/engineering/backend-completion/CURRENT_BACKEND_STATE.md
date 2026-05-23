# Current Backend State

Report date: 2026-05-16

## Runtime Ownership

| Area                       | Current state      | Evidence                                                      |
| -------------------------- | ------------------ | ------------------------------------------------------------- |
| Fastify API                | Present and active | `apps/api/src/app.ts`, `apps/api/package.json`                |
| Legacy Next.js app/runtime | Still present      | `apps/web/package.json`, `apps/web/app/api/**/route.ts`       |
| Root `dev` script          | Points to web      | `package.json` has `dev: pnpm --filter @custivio/web dev`     |
| Root `build` script        | Points to web      | `package.json` has `build: pnpm --filter @custivio/web build` |
| API build/test scripts     | Present            | `build:api`, `test:api`, `start:api`, `dev:api`               |
| Workspace                  | Includes all apps  | `pnpm-workspace.yaml` includes `apps/*`                       |

## Fastify Route Modules

Fastify registers these route modules in `apps/api/src/app.ts`:

- `health.routes.ts`
- `metrics.routes.ts`
- `ops.routes.ts`
- `auth.routes.ts`
- `admin.routes.ts`
- `catalog.routes.ts`
- `assets.routes.ts`
- `stock.routes.ts`
- `custody.routes.ts`
- `transfers.routes.ts`
- `maintenance.routes.ts`
- `audits.routes.ts`
- `imports.routes.ts`
- `reports.routes.ts`
- `locations.routes.ts`

## Fastify Route List

| Method                | Path                                                 | Source                                      |
| --------------------- | ---------------------------------------------------- | ------------------------------------------- |
| GET                   | `/api/health/live`                                   | `apps/api/src/routes/health.routes.ts`      |
| GET                   | `/api/health/ready`                                  | `apps/api/src/routes/health.routes.ts`      |
| GET                   | `/api/metrics`                                       | `apps/api/src/routes/metrics.routes.ts`     |
| GET                   | `/api/ops/status`                                    | `apps/api/src/routes/ops.routes.ts`         |
| POST                  | `/api/auth/login`                                    | `apps/api/src/routes/auth.routes.ts`        |
| POST                  | `/api/auth/logout`                                   | `apps/api/src/routes/auth.routes.ts`        |
| GET                   | `/api/auth/me`                                       | `apps/api/src/routes/auth.routes.ts`        |
| GET/POST              | `/api/admin/users`                                   | `apps/api/src/routes/admin.routes.ts`       |
| PATCH                 | `/api/admin/users/:id`                               | `apps/api/src/routes/admin.routes.ts`       |
| POST                  | `/api/admin/users/:id/reset-password`                | `apps/api/src/routes/admin.routes.ts`       |
| POST                  | `/api/admin/users/:id/disable`                       | `apps/api/src/routes/admin.routes.ts`       |
| GET/POST              | `/api/admin/roles`                                   | `apps/api/src/routes/admin.routes.ts`       |
| PATCH                 | `/api/admin/roles/:id`                               | `apps/api/src/routes/admin.routes.ts`       |
| GET/POST              | `/api/admin/assignments`                             | `apps/api/src/routes/admin.routes.ts`       |
| DELETE                | `/api/admin/assignments/:id`                         | `apps/api/src/routes/admin.routes.ts`       |
| GET/POST              | `/api/catalog/:resource`                             | `apps/api/src/routes/catalog.routes.ts`     |
| PATCH/DELETE          | `/api/catalog/:resource/:id`                         | `apps/api/src/routes/catalog.routes.ts`     |
| GET/POST              | `/api/assets`                                        | `apps/api/src/routes/assets.routes.ts`      |
| GET/PATCH             | `/api/assets/:id`                                    | `apps/api/src/routes/assets.routes.ts`      |
| POST                  | `/api/assets/:id/lifecycle`                          | `apps/api/src/routes/assets.routes.ts`      |
| POST                  | `/api/assets/:id/attachments`                        | `apps/api/src/routes/assets.routes.ts`      |
| GET                   | `/api/assets/:id/attachments/:attachmentId/download` | `apps/api/src/routes/assets.routes.ts`      |
| DELETE                | `/api/assets/:id/attachments/:attachmentId`          | `apps/api/src/routes/assets.routes.ts`      |
| GET/POST/PATCH/DELETE | `/api/locations/:resource`                           | `apps/api/src/routes/locations.routes.ts`   |
| PATCH/DELETE          | `/api/locations/:resource/:id`                       | `apps/api/src/routes/locations.routes.ts`   |
| GET/POST              | `/api/stock/items`                                   | `apps/api/src/routes/stock.routes.ts`       |
| POST                  | `/api/stock/units`                                   | `apps/api/src/routes/stock.routes.ts`       |
| POST                  | `/api/stock/movements`                               | `apps/api/src/routes/stock.routes.ts`       |
| GET/POST              | `/api/custody/checkouts`                             | `apps/api/src/routes/custody.routes.ts`     |
| POST                  | `/api/custody/checkins`                              | `apps/api/src/routes/custody.routes.ts`     |
| POST                  | `/api/custody/handovers`                             | `apps/api/src/routes/custody.routes.ts`     |
| GET/POST              | `/api/transfers`                                     | `apps/api/src/routes/transfers.routes.ts`   |
| POST                  | `/api/transfers/:id/decision`                        | `apps/api/src/routes/transfers.routes.ts`   |
| GET/POST              | `/api/maintenance/tickets`                           | `apps/api/src/routes/maintenance.routes.ts` |
| POST                  | `/api/maintenance/tickets/:id/status`                | `apps/api/src/routes/maintenance.routes.ts` |
| GET/POST              | `/api/maintenance/warranties`                        | `apps/api/src/routes/maintenance.routes.ts` |
| GET/POST              | `/api/audits/campaigns`                              | `apps/api/src/routes/audits.routes.ts`      |
| POST                  | `/api/audits/scans`                                  | `apps/api/src/routes/audits.routes.ts`      |
| GET/POST              | `/api/imports/jobs`                                  | `apps/api/src/routes/imports.routes.ts`     |
| POST                  | `/api/imports/jobs/:id/process`                      | `apps/api/src/routes/imports.routes.ts`     |
| GET/POST              | `/api/reports/exports`                               | `apps/api/src/routes/reports.routes.ts`     |
| GET                   | `/api/reports/exports/:exportId/download`            | `apps/api/src/routes/reports.routes.ts`     |
| GET/POST              | `/api/reports/filters`                               | `apps/api/src/routes/reports.routes.ts`     |
| GET                   | `/api/openapi.json`                                  | `apps/api/src/app.ts`                       |
| GET                   | `/api/docs`                                          | `apps/api/src/plugins/swagger.plugin.ts`    |

## Legacy Next.js API Runtime

`apps/web/app/api` still contains 33 `route.ts` files. They are retained as parity/rollback references only and are the Phase 1 cleanup target after Fastify parity is confirmed.

## OpenAPI Status

- OpenAPI endpoint exists at `GET /api/openapi.json`.
- Swagger UI exists at `GET /api/docs`.
- Latest audit found 44 OpenAPI paths and 0 component schemas.
- Phase 2 will add schemas and tests proving schema coverage.

## Worker Status

- `packages/cache/src/queue.ts`, `locks.ts`, and `idempotency.ts` provide primitives.
- `apps/api/src/workers/README.md` exists.
- No production worker loop, retry scheduler, or dead-letter runner exists yet.

## Storage Status

- MinIO client exists in `packages/storage/src/minio-client.ts`.
- Object key helpers exist in `packages/storage/src/object-keys.ts`.
- MIME/size/download policy helpers exist in `packages/storage/src/policies.ts`.
- Authorized attachment upload/download/delete and export download routes exist.
- Checksum metadata and final download decision docs are still pending.

## Docker And Deployment Status

- Dev Compose exists in `infra/docker-compose.dev.yml` and starts successfully.
- API Dockerfile exists in `infra/Dockerfile.api` but still copies `apps/web/package.json`.
- Production Compose exists in `infra/docker-compose.prod.yml`.
- Previous audit found production Compose config fails without required env values.

## Baseline Test Status

- `pnpm check`: passed after formatting new control docs.
- `pnpm build:api`: passed.
- `pnpm test:api`: passed.
- `RUN_DB_TESTS=1 pnpm test`: passed with local DB access allowed.
- `pnpm db:generate`: passed.
- `pnpm db:migrate`: passed with local tsx IPC/PostgreSQL access allowed.
- `pnpm db:seed`: passed twice with local tsx IPC/PostgreSQL access allowed.
- `pnpm docker:dev`: passed with Docker daemon access allowed.
- `docker compose -f infra/docker-compose.dev.yml ps`: passed.
