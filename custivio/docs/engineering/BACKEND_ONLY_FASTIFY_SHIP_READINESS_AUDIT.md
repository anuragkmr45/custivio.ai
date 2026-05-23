# Backend-Only Fastify Ship Readiness Audit

Final verdict: **MOSTLY READY, SMALL BACKEND GAPS REMAIN**

Audit date: 2026-05-16

Scope: backend API, database, infrastructure, deployment, security, testing, observability, and documentation. Frontend UI visual completeness is out of scope. This audit checks whether the project is actually backend-only after the Fastify migration.

## Executive Summary

| Area                                 | Status  | Readiness | Evidence                                                                                                                                    |
| ------------------------------------ | ------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Fastify API for frontend consumption | READY   |       90% | `apps/api/src/app.ts:31-63`, `docs/engineering/API_CONTRACT.md:1-4`, runtime smoke passed                                                   |
| Database                             | READY   |       92% | `packages/db/src/schema/**`, `packages/db/src/migrations/**`, `pnpm db:generate`, `pnpm db:migrate`, two seed runs passed                   |
| Auth/RBAC/tenant isolation           | READY   |       90% | `packages/auth/src/sessions.ts:111-262`, `tests/integration/auth-rbac.test.ts`, DB-backed tests passed                                      |
| MinIO storage                        | READY   |       88% | `packages/storage/src/minio-client.ts:16-125`, `packages/core/src/assets/asset-service.ts:298-432`                                          |
| Valkey/cache/locking/jobs            | PARTIAL |       80% | `packages/cache/src/index.ts:3-7`, `packages/cache/src/rate-limit.ts:35-74`, completion report notes worker loops not implemented           |
| Observability                        | READY   |       86% | `/api/health/live`, `/api/health/ready`, `/api/metrics`, `/api/ops/status` smoke passed                                                     |
| Production/on-prem infra             | PARTIAL |       82% | `infra/Dockerfile.api:1-29`, `infra/docker-compose.prod.yml:1-103`; Dockerfile still copies `apps/web/package.json`                         |
| Backend-only repository cleanup      | RISK    |       55% | `apps/web` still exists, Next/React dependencies remain, root scripts still build web                                                       |
| Documentation                        | PARTIAL |       78% | Fastify docs exist, but `docs/engineering/BACKEND_ONLY_TARGET_ARCHITECTURE.md` is missing and `AGENTS.md` still describes Next.js as target |

Overall backend/db/infra readiness: **86%**.

Frontend developers can start consuming the Fastify API at `http://localhost:3001`, but the repository is **not yet backend-only** and should not be called backend-only staging-ready until the Next.js removal gates are completed.

## Critical Blockers

1. **Backend-only removal is incomplete.**
   Evidence:
   - `apps/web` still exists and contains 33 Next route handler files under `apps/web/app/api/**`.
   - `apps/web/package.json:7-10` still defines `next` scripts.
   - `apps/web/package.json:16-23` still contains frontend/Next dependencies including `@radix-ui/react-slot`, `next`, `react`, `react-dom`, and `tailwind-merge`.
   - `apps/web/middleware.ts`, `apps/web/next.config.mjs`, `apps/web/next-env.d.ts`, and `apps/web/tailwind.config.ts` still exist.
   - Root `package.json:12-15` still points `dev` and `build` to `@custivio/web`, while Fastify is only on `dev:api` and `build:api`.
   - `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md:5-8` states status is `partial-complete` and `apps/web` was not removed.
   - `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md:70-74` says no Next.js files or dependencies were removed.

## High-Priority Gaps

1. **Governance is stale for a backend-only repo.**
   `AGENTS.md:15-22` still says the target stack includes Next.js, React, Tailwind, shadcn/ui, and Radix UI. `AGENTS.md:43` says `apps/web` owns routes and route handlers.

2. **Required backend-only target architecture file is missing.**
   `docs/engineering/BACKEND_ONLY_TARGET_ARCHITECTURE.md` was not found. A related planning file exists at `docs/engineering/backend-migration/TARGET_FASTIFY_ARCHITECTURE.md`.

3. **OpenAPI is exposed but schema detail is thin.**
   Runtime `/api/openapi.json` returned 44 paths, but `components.schemas` count is 0. `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md:138-140` also records thin OpenAPI schemas.

4. **Long-running worker loops are not implemented.**
   Valkey primitives exist, but `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md:140` says worker loops are documented but not implemented as import/export processors.

5. **Some multi-table business writes are not fully transactional.**
   Several repositories use transactions, for example custody, stock, maintenance, reporting, and RBAC. Asset creation and attachment flows in `packages/core/src/assets/asset-service.ts:173-201` and `packages/core/src/assets/asset-service.ts:298-360` perform multiple writes/object operations without one encompassing DB transaction or compensating transaction contract.

6. **Production Dockerfile still includes web manifest.**
   `infra/Dockerfile.api:7-10` copies `apps/web/package.json`, which is unnecessary for a backend-only API image.

## Medium And Low Priority Gaps

- Prometheus job name still says `custivio-web` in `infra/prometheus/prometheus.yml:5-10`, even though it can scrape the Fastify API if the API runs on port 3000.
- Generic `/api/files/{objectId}/download` is intentionally not implemented because no generic file metadata abstraction exists. Evidence: `docs/engineering/API_CONTRACT.md:699-703`.
- Asset identifier service support exists, but no asset identifier route is exposed. Evidence: `docs/engineering/API_CONTRACT.md:699-701`.
- Local dev infrastructure uses local-only credentials such as MinIO `minioadmin` and Grafana `admin/admin` in `infra/docker-compose.dev.yml:36-38` and `infra/docker-compose.dev.yml:92-97`; production env template uses `REPLACE_ME` placeholders in `infra/env.production.example:9-30`.

## Backend-Only Removal Verification

| Check                           | Result | Evidence                                                                           |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `apps/web` removed              | FAIL   | `apps/web/package.json` exists                                                     |
| No Next package manifest        | FAIL   | `apps/web/package.json:19`                                                         |
| No React package manifest       | FAIL   | `apps/web/package.json:20-21`                                                      |
| No Next route handlers          | FAIL   | 33 files under `apps/web/app/api/**/route.ts`                                      |
| No Next middleware/config       | FAIL   | `apps/web/middleware.ts`, `apps/web/next.config.mjs`                               |
| No frontend Tailwind/Radix deps | FAIL   | `apps/web/package.json:16`, `apps/web/package.json:22`, `apps/web/package.json:30` |
| Root dev/build target Fastify   | FAIL   | `package.json:12-15` still defaults to web for `dev` and `build`                   |
| Fastify app exists              | PASS   | `apps/api/src/app.ts:31-63`                                                        |
| Fastify API build script exists | PASS   | `apps/api/package.json:7-11`                                                       |
| API parity tests exist          | PASS   | `apps/api/src/tests/route-parity.test.ts:15-87`                                    |

## Project Structure And Governance

Status: **PARTIAL**

Evidence:

- No reference repos or `repo-audit` folders were found inside the product repo.
- Feature docs exist under `docs/engineering/features/02-database-foundation.md` through `09-production-hardening.md`.
- Forbidden dependency checker exists in `scripts/check-forbidden-deps.mjs:17-31` and scans package manifests/imports in `scripts/check-forbidden-deps.mjs:69-149`.
- ESLint has Fastify-specific boundaries that block direct DB/cache/storage imports from `apps/api` in `eslint.config.mjs:167-207`.
- Stale governance remains: `AGENTS.md:15-22` and `AGENTS.md:43` still describe Next.js/web ownership.

## Database Readiness

Status: **READY**

Tables found by `pnpm db:generate`: 47 tables, including:

- Tenant/org/user/RBAC/auth: `tenants`, `organizations`, `departments`, `users`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `password_credentials`, `sessions`.
- Location hierarchy: `sites`, `buildings`, `floors`, `rooms`, `racks`, `shelves`, `bins`.
- Catalog/assets: `asset_categories`, `asset_types`, `custom_field_definitions`, `manufacturers`, `asset_models`, `vendors`, `assets`, `asset_identifiers`, `asset_attachments`, `asset_lifecycle_events`.
- Stock: `stock_units`, `stock_items`, `stock_balances`, `stock_ledger_entries`, `stock_adjustments`, `stock_transfers`, `stock_low_stock_rules`.
- Custody/maintenance/audit/reporting: `asset_custody_assignments`, `asset_transfer_requests`, `asset_maintenance_tickets`, `asset_maintenance_events`, `asset_warranties`, `audit_campaigns`, `audit_scan_results`, `audit_findings`, `import_jobs`, `import_job_rows`, `export_jobs`, `saved_filters`, `audit_logs`.

Migration files:

- `packages/db/src/migrations/0000_solid_lucky_pierre.sql`
- `packages/db/src/migrations/0001_foamy_betty_brant.sql`
- `packages/db/src/migrations/0002_yielding_living_tribunal.sql`
- `packages/db/src/migrations/0003_careful_wraith.sql`
- `packages/db/src/migrations/0004_hard_silvermane.sql`
- `packages/db/src/migrations/0005_nervous_lord_tyger.sql`

Evidence:

- `packages/db/src/schema/assets.ts:10-50` defines tenant-scoped asset rows with foreign keys, unique constraints, and common indexes.
- `packages/db/src/schema/assets.ts:76-100` defines attachment metadata in PostgreSQL, including object key and tenant indexes.
- `packages/db/src/schema/audit.ts:8-30` defines append-style audit log schema with tenant/action/entity indexes.
- `packages/db/src/repositories/audit.repository.ts:6-28` only appends audit logs; no update/delete audit log usage was found.
- `packages/db/src/seed.ts:90-198` seeds tenant, permissions, roles, role permissions, and a seed audit log idempotently.
- `tests/integration/seed-idempotency.test.ts:7-29` verifies repeated seeding does not duplicate the default tenant or seed audit log.

Command results:

- `pnpm db:generate`: passed, no schema changes.
- `pnpm db:migrate`: passed.
- `pnpm db:seed`: passed.
- second `pnpm db:seed`: passed.

Database risks:

- Some workflows that write multiple rows and objects still need stricter transaction/compensation review, especially asset attachment upload where MinIO and PostgreSQL writes cannot be one ACID transaction.

## Backend Service Readiness

Status: **READY with high-priority cleanup gaps**

| Module                        | Status  | Evidence                                                                                           | Notes                                                            |
| ----------------------------- | ------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Fastify app shell             | READY   | `apps/api/src/app.ts:31-63`                                                                        | Registers plugins and route modules.                             |
| Auth/session                  | READY   | `packages/auth/src/sessions.ts:111-262`, `apps/api/src/routes/auth.routes.ts:51-141`               | Password login, logout, session lookup, permissions.             |
| RBAC/admin                    | READY   | `docs/engineering/API_CONTRACT.md:145-205`, `apps/api/src/routes/admin.routes.ts`                  | Mutations included in Fastify route set.                         |
| Catalog                       | READY   | `docs/engineering/API_CONTRACT.md:207-296`, `apps/api/src/routes/catalog.routes.ts`                | CRUD/archive contract exists.                                    |
| Locations                     | READY   | `docs/engineering/API_CONTRACT.md:297-315`, `apps/api/src/routes/locations.routes.ts`              | CRUD/archive added after migration.                              |
| Assets/storage                | READY   | `apps/api/src/routes/assets.routes.ts:18-130`, `packages/core/src/assets/asset-service.ts:143-432` | Attachment upload/download/delete implemented.                   |
| Stock                         | READY   | `docs/engineering/API_CONTRACT.md:410-457`, `tests/integration/stock.test.ts`                      | Includes idempotency replay per completion report.               |
| Custody/transfers             | READY   | `docs/engineering/API_CONTRACT.md:458-515`, `tests/integration/operations.test.ts`                 | Checkout, checkin, handover, transfers.                          |
| Maintenance                   | READY   | `docs/engineering/API_CONTRACT.md:516-558`, `tests/integration/operations.test.ts`                 | Tickets, status, warranties.                                     |
| Audit/import/export/reporting | READY   | `docs/engineering/API_CONTRACT.md:559-627`, `tests/integration/reporting.test.ts`                  | Import processing is synchronous/service-driven; no worker loop. |
| Notification/job workers      | PARTIAL | `packages/cache/src/index.ts:3-7`, completion report `:140`                                        | Queue primitive exists; long-running workers missing.            |

Route handlers are thin and delegate to core/auth services. Example: `apps/api/src/routes/assets.routes.ts:18-130` reads params/body/files and calls `@custivio/core`.

Typed errors and request IDs:

- `apps/api/src/http/responses.ts:16-40` defines public error shape.
- `apps/api/src/http/responses.ts:43-68` maps known errors and hides raw internals.
- `apps/api/src/plugins/request-id.plugin.ts:4-9` creates/returns `x-request-id`.

## API And Server Contract Readiness

Status: **READY for frontend integration, PARTIAL for external API publication**

`docs/engineering/API_CONTRACT.md:43-49` documents OpenAPI and Swagger endpoints. `docs/engineering/API_CONTRACT.md:91-627` documents auth, health, admin, catalog, location, assets, stock, custody, maintenance, audit, imports, exports, and reporting.

Runtime smoke results:

| Endpoint                          | Result                             |
| --------------------------------- | ---------------------------------- |
| `GET /api/health/live`            | 200, JSON status metadata          |
| `GET /api/health/ready`           | 200, postgres/valkey/minio healthy |
| `GET /api/metrics`                | 200, Prometheus text, 11183 bytes  |
| `GET /api/openapi.json`           | 200, JSON, 44 paths, 0 schemas     |
| `GET /api/docs`                   | 200, Swagger UI HTML               |
| `GET /api/auth/me` without cookie | 401, typed `missing_session` error |
| `GET /api/ops/status`             | 200, operational status ready      |

API parity:

- `apps/api/src/tests/route-parity.test.ts:15-87` checks 46 existing Next route method endpoints do not 404 in Fastify.
- `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md:19-40` lists ported and additive routes.

API gaps:

- OpenAPI is discoverable but not rich enough for generated frontend clients because `components.schemas` is empty.
- Asset identifier route is not implemented despite service support.

## Auth, RBAC, And Tenant Isolation

Status: **READY**

Evidence:

- Password hashing uses scrypt, random salt, and timing-safe comparison in `packages/auth/src/passwords.ts:27-81`.
- Sessions use random tokens and stored token hashes in `packages/auth/src/sessions.ts:166-176`.
- Login failures and successes are audit-logged in `packages/auth/src/sessions.ts:123-185`.
- Permission checks are centralized in `packages/auth/src/sessions.ts:247-262`.
- Tenant-scoped repository reads/writes are present, for example `packages/db/src/repositories/assets.repository.ts:72-114` and `packages/db/src/repositories/assets.repository.ts:212-250`.
- Seed creates permissions and roles but no default user credentials in `packages/db/src/seed.ts:9-198`.
- `RUN_DB_TESTS=1 pnpm test` passed 60 tests, including auth/RBAC/tenant isolation integration tests.

Risks:

- No production identity provider integration yet; local password auth is currently the production-capable mechanism.
- Department/site scoped authorization is represented in schema/assignments but needs deeper policy tests before complex scoped rollout.

## MinIO File Storage Readiness

Status: **READY**

Evidence:

- MinIO/S3-compatible client, health check, put/get/delete operations: `packages/storage/src/minio-client.ts:16-125`.
- Central object key generation and filename sanitization: `packages/storage/src/object-keys.ts:1-34`.
- MIME and size policy: `packages/storage/src/policies.ts:1-27`.
- Asset upload validates size and MIME before writing object/metadata: `packages/core/src/assets/asset-service.ts:307-343`.
- Asset download checks permission and returns sanitized content disposition: `packages/core/src/assets/asset-service.ts:363-392`.
- Asset delete checks permission and deletes object plus marks metadata deleted: `packages/core/src/assets/asset-service.ts:395-432`.
- MinIO bucket init is configured in `infra/docker-compose.dev.yml:50-63` and `infra/minio/init-bucket.sh:1-6`.

Risks:

- Asset upload writes the object before metadata and audit rows; add compensating cleanup or repository-level transaction around PostgreSQL writes.
- Generic file abstraction is absent by design.

## Valkey, Cache, Lock, Rate Limit, And Job Readiness

Status: **PARTIAL**

Evidence:

- Valkey health check exists in `packages/cache/src/index.ts:15-37`.
- Rate limit implementation exists in `packages/cache/src/rate-limit.ts:35-74`.
- Login route calls `checkLoginRateLimit` before authentication in `apps/api/src/routes/auth.routes.ts:52-79`.
- Cache package exports locks, idempotency, queue, rate limit, and Valkey client in `packages/cache/src/index.ts:3-7`.
- Dev Docker starts Valkey with appendonly persistence and health check in `infra/docker-compose.dev.yml:20-31`.

Gaps:

- Fastify `rate-limit.plugin.ts` is a placeholder only: `apps/api/src/plugins/rate-limit.plugin.ts:1-5`.
- Long-running worker loops for imports/exports are not implemented. Evidence: `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md:140`.

## Infrastructure, Deployment, And Air-Gap Readiness

Status: **PARTIAL**

Evidence:

- Dev Compose includes PostgreSQL, Valkey, MinIO, MinIO init, Mailpit, OTel collector, Prometheus, and Grafana in `infra/docker-compose.dev.yml:3-110`.
- Docker Compose status showed PostgreSQL, Valkey, MinIO, and Mailpit healthy; Grafana, Prometheus, and OTel collector running.
- Production Compose exists in `infra/docker-compose.prod.yml:1-103`.
- API Dockerfile exists in `infra/Dockerfile.api:1-29`.
- Production env template exists with placeholders in `infra/env.production.example:1-30`.
- Production deployment docs exist in `docs/operations/PRODUCTION_DEPLOYMENT.md`.
- Offline release docs exist in `docs/operations/OFFLINE_RELEASE_BUNDLE.md`.
- Backup/restore rehearsal docs exist in `docs/operations/BACKUP_RESTORE_REHEARSAL.md`.

Gaps:

- `infra/Dockerfile.api:7-10` still copies `apps/web/package.json`.
- Root `dev` and `build` scripts still target Next web, not Fastify API.
- Backend-only architecture doc requested by the prompt is missing.
- Production Compose image tags for OTel/Prometheus/Grafana use `latest` in `infra/docker-compose.prod.yml:72-87`; pin versions before production release bundles.

## Observability Readiness

Status: **READY**

Evidence:

- Fastify registers metrics and health routes in `apps/api/src/app.ts:45-47`.
- `/api/health/live` returned 200.
- `/api/health/ready` returned 200 with postgres, valkey, and minio all healthy.
- `/api/metrics` returned Prometheus text.
- `/api/ops/status` returned 200 with dependency health and runbook links.
- Security headers and request IDs were present in runtime HTTP responses.
- OTel collector, Prometheus, and Grafana are present in dev Compose: `infra/docker-compose.dev.yml:70-103`.

Gaps:

- Prometheus job name still references web in `infra/prometheus/prometheus.yml:5-10`.
- Domain-specific metrics for critical flows are basic; add counters/histograms for mutations, import jobs, export jobs, attachment flows, and auth failures before production SLOs.

## Testing Readiness

Status: **READY**

| Test area                 | Exists | Command                          | Result                      | Notes                                                               |
| ------------------------- | ------ | -------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| Forbidden dependency scan | Yes    | `pnpm check:forbidden`           | Passed                      | `scripts/check-forbidden-deps.mjs:17-31`                            |
| Type/lint/format/unit     | Yes    | `pnpm check`                     | Passed                      | DB tests skipped unless `RUN_DB_TESTS=1`                            |
| API package tests         | Yes    | `pnpm test:api`                  | Passed, 14 tests            | Includes health/auth/admin/storage/location/parity tests            |
| DB-backed integration     | Yes    | `RUN_DB_TESTS=1 pnpm test`       | Passed, 19 files / 60 tests | Exercises auth, assets, catalog, stock, operations, reporting, seed |
| Migration                 | Yes    | `pnpm db:migrate`                | Passed                      | Local PostgreSQL required                                           |
| Seed idempotency          | Yes    | `pnpm db:seed` twice             | Passed                      | Dedicated test also exists                                          |
| Docker dev infra          | Yes    | `pnpm docker:dev`                | Passed                      | Compose services started                                            |
| Runtime smoke             | Yes    | curl Fastify endpoints           | Passed                      | Port 3001                                                           |
| OpenAPI exposure          | Yes    | `/api/openapi.json`, `/api/docs` | Passed                      | Schemas thin                                                        |

## Security And License Readiness

Status: **READY with cleanup gaps**

Evidence:

- Forbidden dependency check passed.
- Forbidden packages include Prisma, Supabase, Firebase, MongoDB/Mongoose, Neon, Clerk, Resend, and Vercel Blob in `scripts/check-forbidden-deps.mjs:17-31`.
- Fastify API code is lint-blocked from importing direct DB/cache/storage and Next dependencies in `eslint.config.mjs:167-207`.
- Security headers are registered through Helmet in `apps/api/src/plugins/security.plugin.ts:7-28`.
- CORS is configured from validated app config in `apps/api/src/plugins/security.plugin.ts:8-17`.
- `.env` is ignored by `.gitignore:7`.
- `.env.example` contains local dev values only in `.env.example:1-16`; production template uses `REPLACE_ME` placeholders in `infra/env.production.example:9-30`.

Risks:

- Next/React/frontend deps remain because `apps/web` remains.
- Local test password `CorrectHorseBattery1` appears in integration tests; this is test-only, not seeded as a default app credential.
- Dev Compose has local-only MinIO/Grafana credentials; acceptable for dev, not production.

## Commands Run

| Command                      | Result                         | Notes                                                                         |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| `pnpm install`               | Passed                         | Lockfile already up to date                                                   |
| `pnpm check:forbidden`       | Passed                         | Re-run after audit, no forbidden dependency found                             |
| `pnpm check`                 | Passed                         | Typecheck, lint, format, non-DB tests, forbidden check                        |
| `pnpm build`                 | Passed after escalation        | Initial sandbox-only Turbopack bind failure; root build still builds Next web |
| `pnpm build:api`             | Passed                         | Fastify API type build                                                        |
| `pnpm db:generate`           | Passed                         | 47 tables, no schema changes                                                  |
| `pnpm db:migrate`            | Passed                         | Required local PostgreSQL/escalated IPC access                                |
| `pnpm db:seed`               | Passed                         | First run                                                                     |
| `pnpm db:seed`               | Passed                         | Second idempotency run                                                        |
| `RUN_DB_TESTS=1 pnpm test`   | Passed                         | 19 test files, 60 tests                                                       |
| `pnpm test:api`              | Passed                         | 6 files, 14 tests                                                             |
| `pnpm docker:dev`            | Passed                         | Services running; health shown for key dependencies                           |
| `API_PORT=3001 pnpm dev:api` | Passed for smoke, then stopped | Server stopped with expected exit 143 after audit                             |
| curl `/api/health/live`      | Passed                         | 200                                                                           |
| curl `/api/health/ready`     | Passed                         | 200, all dependencies healthy                                                 |
| curl `/api/metrics`          | Passed                         | 200, Prometheus text                                                          |
| curl `/api/openapi.json`     | Passed                         | 200, 44 paths, 0 schemas                                                      |
| curl `/api/docs`             | Passed                         | 200                                                                           |
| curl `/api/auth/me`          | Passed                         | 401 typed missing-session error                                               |
| curl `/api/ops/status`       | Passed                         | 200, ready                                                                    |

## Final Readiness Decision

Verdict: **MOSTLY READY, SMALL BACKEND GAPS REMAIN**

The Fastify API, database, auth/RBAC, storage, core services, dev infrastructure, testing gates, and runtime smoke checks are strong enough for frontend integration to begin. The project is not yet a clean backend-only repository because Next.js remains, root scripts still default to the web app, the backend-only target architecture doc is missing, and OpenAPI schemas are too thin for robust generated-client workflows.

## Exact Next Actions

1. Create a rollback branch or tag, then execute the documented Next removal plan.
2. Remove `apps/web`, `next`, `react`, `react-dom`, Tailwind/Radix frontend dependencies, Next config, middleware, and stale Next route handlers.
3. Change root `dev` and `build` scripts to target `@custivio/api`; keep `build:api` as an alias if desired.
4. Create `docs/engineering/BACKEND_ONLY_TARGET_ARCHITECTURE.md` or rename/update the current `backend-migration/TARGET_FASTIFY_ARCHITECTURE.md` into the requested canonical location.
5. Update `AGENTS.md`, `PROJECT_PROGRESS.md`, and handoff docs so they no longer identify Next.js as the target stack.
6. Remove `apps/web/package.json` copying from `infra/Dockerfile.api`.
7. Expand Fastify OpenAPI route schemas for request bodies, responses, auth, error shapes, and file responses.
8. Decide whether import/export workers must exist before staging; if yes, implement Valkey queue workers and retry/dead-letter behavior.
9. Add a transaction/compensation note and tests for asset create/update/attachment multi-write workflows.
10. Re-run all gates: `pnpm install`, `pnpm check:forbidden`, `pnpm check`, `pnpm build`, `pnpm build:api`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed` twice, `RUN_DB_TESTS=1 pnpm test`, `pnpm test:api`, `pnpm docker:dev`, API smoke endpoints, and `docker build -f infra/Dockerfile.api`.

## Evidence Appendix

Important files inspected:

- `AGENTS.md`
- `package.json`
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `apps/api/src/routes/*.routes.ts`
- `apps/api/src/plugins/*.plugin.ts`
- `apps/api/src/http/*.ts`
- `apps/api/src/tests/*.test.ts`
- `apps/web/package.json`
- `apps/web/app/api/**/route.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.mjs`
- `apps/web/tailwind.config.ts`
- `docs/engineering/API_CONTRACT.md`
- `docs/engineering/FRONTEND_HANDOFF.md`
- `docs/engineering/PROJECT_PROGRESS.md`
- `docs/engineering/TESTING_GATES.md`
- `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md`
- `docs/engineering/backend-migration/TARGET_FASTIFY_ARCHITECTURE.md`
- `docs/operations/PRODUCTION_DEPLOYMENT.md`
- `docs/operations/OFFLINE_RELEASE_BUNDLE.md`
- `docs/operations/BACKUP_RESTORE_REHEARSAL.md`
- `packages/auth/src/**`
- `packages/cache/src/**`
- `packages/core/src/**`
- `packages/db/src/schema/**`
- `packages/db/src/repositories/**`
- `packages/db/src/migrations/**`
- `packages/db/src/seed.ts`
- `packages/storage/src/**`
- `infra/docker-compose.dev.yml`
- `infra/docker-compose.prod.yml`
- `infra/Dockerfile.api`
- `infra/env.production.example`
- `infra/prometheus/prometheus.yml`
- `infra/minio/init-bucket.sh`
- `scripts/check-forbidden-deps.mjs`
- `eslint.config.mjs`
- `tests/integration/**`
