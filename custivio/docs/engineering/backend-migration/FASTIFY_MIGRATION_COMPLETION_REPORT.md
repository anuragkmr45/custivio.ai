# Fastify Migration Completion Report

## Status

Status: `partial-complete`

Fastify API migration phases A-K and M validation are complete. `apps/web` was not removed because the removal plan requires full acceptance of backend-only ownership and a rollback point before deleting the retained Next.js parity reference.

## What Was Migrated

- Added Fastify backend app in `apps/api`.
- Preserved existing `/api/...` paths from the Next.js route inventory.
- Reused existing package boundaries: `packages/db`, `packages/core`, `packages/auth`, `packages/storage`, `packages/cache`, `packages/config`, and `packages/telemetry`.
- Added Fastify plugins for config, security headers, cookies/auth context, request IDs, logging, metrics, multipart upload, rate-limit integration, and Swagger/OpenAPI.
- Added OpenAPI endpoints:
  - `GET /api/openapi.json`
  - `GET /api/docs`

## Routes Ported

Existing Next.js API parity routes are registered in Fastify:

- Health/ops: `/api/health/live`, `/api/health/ready`, `/api/metrics`, `/api/ops/status`.
- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Admin: `/api/admin/users`, `/api/admin/roles`, `/api/admin/assignments`.
- Catalog: `/api/catalog/:resource`, `/api/catalog/:resource/:id`.
- Assets: `/api/assets`, `/api/assets/:id`, `/api/assets/:id/attachments`, `/api/assets/:id/lifecycle`.
- Stock: `/api/stock/items`, `/api/stock/units`, `/api/stock/movements`.
- Custody/transfers: `/api/custody/checkouts`, `/api/custody/checkins`, `/api/custody/handovers`, `/api/transfers`, `/api/transfers/:id/decision`.
- Maintenance: `/api/maintenance/tickets`, `/api/maintenance/tickets/:id/status`, `/api/maintenance/warranties`.
- Audit/import/reporting: `/api/audits/campaigns`, `/api/audits/scans`, `/api/imports/jobs`, `/api/imports/jobs/:id/process`, `/api/reports/exports`, `/api/reports/filters`.

Additive backend routes were implemented for blocker coverage:

- `GET /api/assets/:id/attachments/:attachmentId/download`
- `DELETE /api/assets/:id/attachments/:attachmentId`
- `GET /api/reports/exports/:exportId/download`
- `GET/POST/PATCH/DELETE /api/locations/:resource`
- `PATCH/DELETE /api/locations/:resource/:id`
- Admin mutation routes for users, roles, assignments, password reset, and user disable.

## Blockers Fixed

1. Authorized file flows:
   - Added MinIO get/delete helpers and storage policy helpers.
   - Added authorized asset attachment download/delete and report export download services/routes.
   - Generic `/api/files/:objectId/download` remains intentionally unimplemented because no generic file metadata abstraction exists.

2. Valkey primitives:
   - Added locks, idempotency, and basic queue primitives in `packages/cache`.
   - Added deterministic cache primitive tests.
   - Added stock movement idempotency replay through PostgreSQL lookup.

3. Admin/RBAC mutations:
   - Added user create/update/reset-password/disable.
   - Added role create/update and assignment create/delete.
   - Kept hashing inside `packages/auth`.

4. Location management:
   - Added core location service and CRUD/archive routes for sites, buildings, floors, rooms, racks, shelves, and bins.

5. Production/on-prem packaging:
   - Added `infra/Dockerfile.api`, `infra/docker-compose.prod.yml`, production env template, release-bundle scripts, and operations docs.
   - Verified `docker build -f infra/Dockerfile.api -t custivio-api:test .` passes.

## Files Removed

- Removed empty placeholder route file `apps/api/src/routes/files.routes.ts`.

No Next.js files were removed.

## Dependencies Removed

None. Next.js, React, and UI dependencies remain while `apps/web` is retained as parity/rollback reference.

## Commands Run

Passed:

- `pnpm install`
- `pnpm build:api`
- `pnpm test:api`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm format:check`
- `pnpm test`
- `pnpm check:forbidden`
- `pnpm check`
- `pnpm build` after sandbox escalation
- `pnpm docker:dev` after Docker daemon escalation
- `pnpm db:generate`
- `pnpm db:migrate` after tsx IPC escalation
- `pnpm db:seed` after tsx IPC escalation
- second `pnpm db:seed` after tsx IPC escalation
- `RUN_DB_TESTS=1 pnpm test` after localhost PostgreSQL escalation
- `docker compose -f infra/docker-compose.dev.yml ps`
- `docker build -f infra/Dockerfile.api -t custivio-api:test .`
- Runtime smoke against `API_PORT=3001 pnpm dev:api`:
  - `GET /api/health/live` -> `200`
  - `GET /api/health/ready` -> `200`, postgres/valkey/minio healthy
  - `GET /api/metrics` -> `200`
  - `GET /api/openapi.json` -> `200`

Expected sandbox-only failures before escalation:

- `pnpm build` failed once because Turbopack could not bind a sandboxed local port.
- `pnpm docker:dev` failed once because the sandbox could not access the Docker daemon socket.
- `pnpm db:migrate` failed once because `tsx` could not create an IPC pipe in the sandbox.
- `RUN_DB_TESTS=1 pnpm test` failed once because sandboxed tests could not connect to localhost PostgreSQL.
- `pnpm dev:api` failed once on default `API_PORT=3000` because that port was already in use; smoke was rerun successfully with `API_PORT=3001`.

## Tests Passed

- API route tests: 14 tests passed.
- Full non-DB test suite through `pnpm check`: 28 tests passed, DB-gated tests skipped as intended.
- DB-backed suite with `RUN_DB_TESTS=1`: 60 tests passed.
- Docker dev services show PostgreSQL, Valkey, MinIO, and Mailpit healthy; Prometheus, Grafana, and OTel collector running.

## API Compatibility Changes

See `docs/engineering/backend-migration/API_COMPATIBILITY_CHANGES.md`.

Summary:

- No existing `/api/...` path was intentionally removed.
- Existing response/error/request ID conventions were preserved.
- New file, admin mutation, location, OpenAPI, and docs routes were additive.
- Generic `/api/files/:objectId/download` is not present because the domain model has no generic file abstraction.

## Frontend Handoff Status

Frontend teams can start consuming the Fastify API at `http://localhost:3001` using `docs/engineering/API_CONTRACT.md` and `docs/engineering/FRONTEND_HANDOFF.md`.

Use cookie auth with `credentials: "include"` and the `custivio_session` cookie. OpenAPI is available at `/api/openapi.json` and Swagger UI at `/api/docs`.

## Remaining Backend/Infra Gaps

- Next.js is still retained and should be removed only after the explicit removal gates and rollback plan are accepted.
- OpenAPI currently registers paths and basic parameters; rich request/response schemas are still thin and should be expanded before external API publication.
- Worker loops are documented but not implemented as long-running import/export processors.
- Generic file download remains out of scope until a generic file metadata table/service exists.

## Backend-Only Readiness

Backend API readiness for frontend consumption: `90%`.

Backend-only repository readiness: `75%`, because `apps/web` and frontend dependencies are intentionally retained pending removal approval.
