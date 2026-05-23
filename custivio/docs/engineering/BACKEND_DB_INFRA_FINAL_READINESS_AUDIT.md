Backend/DB/Infra readiness: 88%
Verdict: MOSTLY READY, BUT BLOCKERS REMAIN
Frontend can start: partially, Fastify APIs are broadly usable but backend-only release ownership and a few backend contract gaps still need closure
Critical blockers: 1
High-priority gaps: 7
Commands passed: 26
Commands failed: 3
Report date: 2026-05-16

# Backend/DB/Infra Final Readiness Audit

## Final Summary

```text
Backend/DB/Infra readiness: 88%
Verdict: MOSTLY READY, BUT BLOCKERS REMAIN
Frontend can start: partially, Fastify APIs are broadly usable but backend-only release ownership and a few backend contract gaps still need closure
Critical blockers: 1
High-priority gaps: 7
```

## Score Breakdown

| Area                             | Score | Max | Status  | Notes                                                                  |
| -------------------------------- | ----: | --: | ------- | ---------------------------------------------------------------------- |
| Database                         |    18 |  18 | READY   | Modular Drizzle schema, migrations, seed idempotency, DB tests passed. |
| Backend APIs/services            |    19 |  22 | PARTIAL | Fastify coverage is broad; OpenAPI schemas and some transactions lag.  |
| Auth/RBAC/tenant isolation       |    11 |  12 | READY   | Auth, admin mutation APIs, RBAC, tenant tests present and passing.     |
| Storage/MinIO                    |     8 |  10 | PARTIAL | Upload/download/delete works; checksum and presigned contract missing. |
| Valkey/cache/jobs                |     6 |   8 | PARTIAL | Client, health, locks, idempotency, queue primitives exist; no worker. |
| Infrastructure/on-prem           |     8 |  10 | PARTIAL | Dev/prod infra exists; backend-only packaging still has cleanup gaps.  |
| Observability                    |     5 |   6 | PARTIAL | Health, metrics, logs, dashboards exist; domain metrics are thin.      |
| Testing                          |    10 |  10 | READY   | Unit, integration, DB, API, auth, storage, cache tests passed.         |
| Security/license/release hygiene |     3 |   4 | PARTIAL | Forbidden deps pass; release worktree and backend-only cleanup remain. |
| Total                            |    88 | 100 | PARTIAL | Mostly ready, with one release/migration blocker.                      |

## Executive Summary

The backend has moved substantially to Fastify in `apps/api` and is usable for most frontend development. The Fastify server exposes health, metrics, ops, auth, admin/RBAC, catalog, asset, attachment, location, stock, custody, transfer, maintenance, audit, import, export, and report routes from `apps/api/src/app.ts` and `apps/api/src/routes/**`. API parity tests pass, DB-backed integration tests pass, and the dev infrastructure starts successfully.

The main blocker is release ownership after the migration: `apps/web` and legacy Next.js API routes still exist, root scripts still default to the Next web build, and the API Dockerfile still copies `apps/web/package.json`. This does not stop frontend developers from consuming Fastify routes, but it does block calling the backend/db/infra side fully ship-ready because default build/deploy behavior is still mixed.

Frontend can start partially against stable backend areas: auth/session, admin/RBAC, catalog, locations, assets, attachments, stock, custody/transfers, maintenance, audits, imports, reports, health, ops, and metrics. Frontend work should wait on generated API-client assumptions, async worker/retry screens, final backend-only deployment expectations, and any UI that depends on presigned download URLs or file checksums.

## Critical Blockers

| Blocker                                                                           | Why it matters                                                                                                                                                                                                  | Evidence path                                                                                                                                                                                       | Required fix                                                                                                                                                                                                                                                                                   | Estimated impact on frontend team                                                                                                                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend-only migration is not fully completed in default build/release ownership. | Staging and release flows can accidentally build or ship the legacy Next app instead of a backend-only Fastify service. The prompt explicitly treats both backends as a migration state that must be evaluated. | `apps/api/src/app.ts`, `apps/web/app/api/**/route.ts`, `apps/web/package.json`, `package.json`, `infra/Dockerfile.api`, `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md` | Finish the documented removal gates: switch root `dev`/`build` defaults or add explicit backend-only defaults, remove or quarantine legacy Next API routes after parity signoff, remove `apps/web` package references from API Dockerfile, and update `AGENTS.md` to match the backend target. | Frontend can still use Fastify APIs, but staging/release assumptions and generated client base URLs must be coordinated manually until cleanup is complete. |

## High-Priority Gaps

| Gap                                                                                            | Evidence                                                                                                                                                   | Required fix                                                                                                                 | Impact                                                                                         |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| OpenAPI has paths but no component schemas.                                                    | Runtime inspection of `/api/openapi.json` returned `pathCount: 44` and `schemaCount: 0`; `apps/api/src/plugins/swagger.plugin.ts`                          | Add JSON schemas/Zod-to-OpenAPI contracts for requests and responses.                                                        | Frontend cannot safely generate strongly typed API clients from OpenAPI yet.                   |
| Worker runtime is documented but not implemented.                                              | `apps/api/src/workers/README.md`, `packages/cache/src/queue.ts`                                                                                            | Add actual worker process, retry policy, dead-letter handling, and tests for import/export jobs.                             | Frontend should avoid assuming background processing/retry UX is production-complete.          |
| Some multi-step asset/storage mutations lack an explicit transaction or compensation boundary. | `packages/core/src/assets/asset-service.ts`, `packages/db/src/repositories/assets.repository.ts`                                                           | Wrap DB-side multi-write workflows in transactions and document object-store compensation on partial failure.                | Rare partial writes can create confusing attachment/lifecycle states.                          |
| Storage contract lacks checksum and presigned URL support.                                     | `packages/storage/src/policies.ts`, `packages/core/src/assets/asset-service.ts`, `apps/api/src/routes/assets.routes.ts`                                    | Add checksum capture/validation and either document streaming-only downloads or add presigned download routes.               | Frontend file widgets must use current authorized streaming routes, not presigned assumptions. |
| Production compose validation requires env injection and needs a clearer release command.      | `infra/docker-compose.prod.yml`, `infra/env.production.example`; `docker compose -f infra/docker-compose.prod.yml config` failed without required secrets. | Add documented `--env-file infra/env.production.example` validation flow or a safe CI validation env file with placeholders. | Deployment engineers need exact commands before staging packaging is frictionless.             |
| Prometheus config still carries web-era naming/target assumptions.                             | `infra/prometheus/prometheus.yml`, `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md`                                             | Rename scrape jobs and align default target/port with Fastify API deployment.                                                | Metrics may be scraped from the wrong service/port in some local setups.                       |
| Release hygiene is not clean.                                                                  | `git status --short` showed many modified/untracked implementation files and generated/deleted artifacts.                                                  | Commit or intentionally stage/remove generated files before release tagging.                                                 | Backend can be tested, but release provenance is not clean yet.                                |

## What Is Ready

- Fastify application composition: `apps/api/src/app.ts`.
- Fastify route modules: `apps/api/src/routes/*.routes.ts`.
- API tests and parity tests: `apps/api/src/tests/*.test.ts`.
- Modular Drizzle schema: `packages/db/src/schema/*.ts`.
- Repository layer: `packages/db/src/repositories/*.ts`.
- Migrations: `packages/db/src/migrations/0000_*.sql` through `0005_*.sql`.
- Idempotent seed: `packages/db/src/seed.ts` and `tests/integration/seed-idempotency.test.ts`.
- Auth/session/password handling: `packages/auth/src/passwords.ts`, `packages/auth/src/sessions.ts`.
- Admin/RBAC services: `packages/auth/src/admin.ts`, `packages/db/src/repositories/rbac.repository.ts`.
- Asset, catalog, location, stock, reporting services: `packages/core/src/**`.
- MinIO wrapper and object key policy: `packages/storage/src/minio-client.ts`, `packages/storage/src/object-keys.ts`.
- Valkey primitives: `packages/cache/src/valkey-client.ts`, `packages/cache/src/locks.ts`, `packages/cache/src/idempotency.ts`, `packages/cache/src/queue.ts`, `packages/cache/src/rate-limit.ts`.
- Dev infrastructure: `infra/docker-compose.dev.yml`.
- Production infrastructure artifacts: `infra/Dockerfile.api`, `infra/docker-compose.prod.yml`, `infra/env.production.example`.
- Operations docs: `docs/operations/*.md`.

## What Is Not Ready

- Fully backend-only default build/release ownership.
- Strong OpenAPI schema contracts for generated frontend clients.
- Production worker loop, retry, and dead-letter implementation.
- Storage checksum validation and presigned URL route if required by frontend.
- Clean release/tag state.
- Prometheus default naming/target alignment with the Fastify backend.

## Frontend Handoff Decision

Frontend can start partially.

| Frontend area                 | Can start? | Backend dependency                                                                           | Notes                                                                   |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Login/logout/current user     | Yes        | `apps/api/src/routes/auth.routes.ts`, `packages/auth/src/sessions.ts`                        | Use cookie-based session APIs.                                          |
| Admin users/roles/assignments | Yes        | `apps/api/src/routes/admin.routes.ts`, `packages/auth/src/admin.ts`                          | Permission-protected mutation APIs exist and are tested.                |
| Catalog management            | Yes        | `apps/api/src/routes/catalog.routes.ts`, `packages/core/src/catalog/catalog-service.ts`      | CRUD route groups exist.                                                |
| Location hierarchy            | Yes        | `apps/api/src/routes/locations.routes.ts`, `packages/core/src/locations/location-service.ts` | Can build site/building/floor/room/rack/shelf flows.                    |
| Asset registry                | Yes        | `apps/api/src/routes/assets.routes.ts`, `packages/core/src/assets/asset-service.ts`          | Core API exists; frontend should handle typed errors.                   |
| Asset attachments             | Partial    | `apps/api/src/routes/assets.routes.ts`, `packages/storage/src/policies.ts`                   | Upload/download/delete exist; checksum/presigned assumptions must wait. |
| Stock/inventory               | Yes        | `apps/api/src/routes/stock.routes.ts`, `packages/core/src/stock/stock-service.ts`            | Items, units, movement flows exist.                                     |
| Custody/transfers             | Yes        | `apps/api/src/routes/custody.routes.ts`, `apps/api/src/routes/transfers.routes.ts`           | Checkouts/checkins/handovers and decisions exist.                       |
| Maintenance                   | Yes        | `apps/api/src/routes/maintenance.routes.ts`                                                  | Tickets, status changes, warranties exist.                              |
| Audits/imports/reports        | Partial    | `apps/api/src/routes/audits.routes.ts`, `imports.routes.ts`, `reports.routes.ts`             | APIs exist; worker/retry UX should wait.                                |
| Generated API client          | Not yet    | `/api/openapi.json`                                                                          | Paths exist, but schemas are missing.                                   |
| Deployment/admin ops UI       | Partial    | `apps/api/src/routes/ops.routes.ts`, `docs/operations/*.md`                                  | Ops status exists; backend-only release cleanup remains.                |

## Command Results

| Command                                                                                 | Result         | Notes                                                                                           |
| --------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm install`                                                                          | PASS           | Workspace install completed with lockfile up to date.                                           |
| `pnpm check:forbidden`                                                                  | PASS           | Forbidden dependency check passed.                                                              |
| `pnpm check`                                                                            | PASS           | Typecheck, lint, format check, tests, forbidden check passed.                                   |
| `pnpm build`                                                                            | FAIL then PASS | First run failed in sandbox due Turbopack worker/bind permission; rerun with escalation passed. |
| `pnpm db:generate`                                                                      | PASS           | No schema changes; Drizzle detected 47 tables.                                                  |
| `pnpm db:migrate`                                                                       | PASS           | Migration applied against local PostgreSQL.                                                     |
| `pnpm db:seed`                                                                          | PASS           | Seed completed.                                                                                 |
| `pnpm db:seed`                                                                          | PASS           | Second seed completed, confirming idempotency.                                                  |
| `RUN_DB_TESTS=1 pnpm test`                                                              | PASS           | 19 test files and 60 tests passed.                                                              |
| `pnpm build:api`                                                                        | PASS           | Fastify API TypeScript build passed.                                                            |
| `pnpm test:api`                                                                         | PASS           | 6 API test files and 14 tests passed.                                                           |
| `pnpm docker:dev`                                                                       | PASS           | Dev Compose stack started.                                                                      |
| `docker compose -f infra/docker-compose.dev.yml ps`                                     | PASS           | Postgres, Valkey, MinIO, Mailpit healthy; Prometheus/Grafana/OTel running.                      |
| `docker build -f infra/Dockerfile.api .`                                                | PASS           | API image built; Dockerfile still copies `apps/web/package.json`.                               |
| `docker compose -f infra/docker-compose.prod.yml config`                                | FAIL           | Failed because required `POSTGRES_PASSWORD` env var was intentionally unset.                    |
| `API_PORT=3001 pnpm dev:api`                                                            | PASS           | Fastify server started for endpoint smoke checks.                                               |
| `GET /api/health/live`                                                                  | PASS           | Returned 200 with liveness metadata.                                                            |
| `GET /api/health/ready`                                                                 | PASS           | Returned 200 with Postgres, Valkey, and MinIO ready.                                            |
| `GET /api/metrics`                                                                      | PASS           | Returned Prometheus text exposition.                                                            |
| `GET /api/ops/status`                                                                   | PASS           | Returned ready operational status.                                                              |
| `GET /api/openapi.json`                                                                 | PASS           | Returned OpenAPI paths; component schemas missing.                                              |
| `GET /api/docs`                                                                         | PASS           | Returned Swagger UI HTML.                                                                       |
| `GET /api/auth/me` without session                                                      | PASS           | Returned expected typed 401 `missing_session`.                                                  |
| `pnpm format:check`                                                                     | FAIL           | New audit report needed Prettier formatting.                                                    |
| `pnpm exec prettier --write docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT.md` | PASS           | Formatted this report.                                                                          |
| `pnpm format:check`                                                                     | PASS           | All matched files use Prettier style after formatting.                                          |

## A. Project Structure Audit

| Area                                | Status  | Evidence files                                                                                                                 | Risk   | Notes                                                                         |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------- |
| Backend runtime                     | PARTIAL | `apps/api/src/app.ts`, `apps/web/app/api/**/route.ts`                                                                          | Medium | Fastify is active, but legacy Next API routes remain.                         |
| API app present                     | READY   | `apps/api/package.json`, `apps/api/src/server.ts`                                                                              | Low    | Fastify API package exists and builds.                                        |
| Web app present                     | PARTIAL | `apps/web/package.json`, `apps/web/app/api/**/route.ts`                                                                        | Medium | Web app remains after backend migration; default root build still targets it. |
| Backend packages                    | READY   | `packages/db`, `packages/core`, `packages/auth`, `packages/storage`, `packages/cache`, `packages/config`, `packages/telemetry` | Low    | Shared packages are organized and tested.                                     |
| Governance docs                     | PARTIAL | `AGENTS.md`, `docs/engineering/*.md`                                                                                           | Medium | Docs exist, but root `AGENTS.md` still describes Next.js as target stack.     |
| Reference repos inside product repo | READY   | `custivio/` tree inspection                                                                                                    | Low    | No `repo-audit` or cloned reference repos found inside product repo.          |
| Package scripts                     | PARTIAL | `package.json`                                                                                                                 | Medium | API scripts exist, but root `dev`/`build` still point at `@custivio/web`.     |
| ESLint boundaries                   | READY   | `eslint.config.mjs`, `tsconfig.eslint.json`                                                                                    | Low    | Lint passes.                                                                  |
| Forbidden dependency checker        | READY   | `scripts/check-forbidden-deps.mjs`                                                                                             | Low    | Check passes.                                                                 |

## B. Database Audit

| DB area                    | Status | Evidence                                                                                     | Missing                                | Risk |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------- | -------------------------------------- | ---- |
| Schema modules             | READY  | `packages/db/src/schema/*.ts`                                                                | None found                             | Low  |
| Migrations                 | READY  | `packages/db/src/migrations/0000_*.sql` through `0005_*.sql`                                 | None found                             | Low  |
| Seed                       | READY  | `packages/db/src/seed.ts`, `tests/integration/seed-idempotency.test.ts`                      | None found                             | Low  |
| Tenant-owned tables        | READY  | `packages/db/src/schema/assets.ts`, `stock.ts`, `catalog.ts`, `locations.ts`, `reporting.ts` | Needs ongoing review for future tables | Low  |
| Tenant-scoped repositories | READY  | `packages/db/src/repositories/*.ts`                                                          | None material found                    | Low  |
| Indexes/FKs/uniques        | READY  | `packages/db/src/schema/assets.ts`, `rbac.ts`, `stock.ts`, `locations.ts`                    | None material found                    | Low  |
| Audit logs                 | READY  | `packages/db/src/schema/audit.ts`, `packages/db/src/repositories/audit.repository.ts`        | No update/delete helpers found         | Low  |
| Asset catalog              | READY  | `packages/db/src/schema/asset-catalog.ts`                                                    | None found                             | Low  |
| Asset registry             | READY  | `packages/db/src/schema/assets.ts`                                                           | None found                             | Low  |
| Location hierarchy         | READY  | `packages/db/src/schema/locations.ts`                                                        | None found                             | Low  |
| User/RBAC                  | READY  | `packages/db/src/schema/users.ts`, `rbac.ts`, `auth.ts`                                      | None found                             | Low  |
| Stock/inventory            | READY  | `packages/db/src/schema/stock.ts`                                                            | None found                             | Low  |
| Custody/movement           | READY  | `packages/db/src/schema/custody.ts`                                                          | None found                             | Low  |
| Maintenance                | READY  | `packages/db/src/schema/maintenance.ts`                                                      | None found                             | Low  |
| Audit/import/export/report | READY  | `packages/db/src/schema/reporting.ts`, `audit.ts`                                            | None found                             | Low  |
| Repository tests           | READY  | `tests/integration/*.test.ts`, `RUN_DB_TESTS=1 pnpm test`                                    | None found                             | Low  |

Tables found by `pnpm db:generate`: `asset_categories`, `asset_models`, `asset_types`, `custom_field_definitions`, `manufacturers`, `vendors`, `asset_attachments`, `asset_identifiers`, `asset_lifecycle_events`, `assets`, `audit_logs`, `password_credentials`, `sessions`, `asset_custody_assignments`, `asset_transfer_requests`, `bins`, `buildings`, `floors`, `racks`, `rooms`, `shelves`, `sites`, `asset_maintenance_events`, `asset_maintenance_tickets`, `asset_warranties`, `departments`, `organizations`, `permissions`, `role_permissions`, `roles`, `user_role_assignments`, `audit_campaigns`, `audit_findings`, `audit_scan_results`, `export_jobs`, `import_job_rows`, `import_jobs`, `saved_filters`, `stock_adjustments`, `stock_balances`, `stock_items`, `stock_ledger_entries`, `stock_low_stock_rules`, `stock_transfers`, `stock_units`, `tenants`, `users`.

Missing tables: none identified against the current roadmap modules.

Migration result: `pnpm db:migrate` passed.

Seed result: `pnpm db:seed` passed twice.

DB readiness score: 18/18.

## C. Backend API And Service Audit

| Module           | Route/path                                                                                       | Method                | Runtime location                                                | Validation | Auth            | Permission     | Tenant check       | Audit log | Tests | Status  | Notes                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------- | --------------------------------------------------------------- | ---------- | --------------- | -------------- | ------------------ | --------- | ----- | ------- | ------------------------------------------------------ |
| Health           | `/api/health/live`, `/api/health/ready`                                                          | GET                   | `apps/api/src/routes/health.routes.ts`                          | N/A        | Public          | N/A            | N/A                | N/A       | Yes   | READY   | Smoke checks passed.                                   |
| Metrics          | `/api/metrics`                                                                                   | GET                   | `apps/api/src/routes/metrics.routes.ts`                         | N/A        | Public/internal | N/A            | N/A                | N/A       | Yes   | READY   | Prometheus text returned.                              |
| Ops              | `/api/ops/status`                                                                                | GET                   | `apps/api/src/routes/ops.routes.ts`                             | N/A        | Protected       | Yes            | Yes                | N/A       | Yes   | READY   | Smoke check passed.                                    |
| Auth             | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`                                            | GET/POST              | `apps/api/src/routes/auth.routes.ts`                            | Yes        | Mixed           | Session checks | Tenant via session | Yes       | Yes   | READY   | 401 typed response verified for unauthenticated `/me`. |
| Admin users      | `/api/admin/users` and user mutation routes                                                      | GET/POST/PATCH        | `apps/api/src/routes/admin.routes.ts`                           | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Admin mutation APIs now exist.                         |
| Admin roles      | `/api/admin/roles`                                                                               | GET/POST/PATCH        | `apps/api/src/routes/admin.routes.ts`                           | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Role APIs exist and tests pass.                        |
| RBAC assignments | `/api/admin/assignments`                                                                         | GET/POST/DELETE       | `apps/api/src/routes/admin.routes.ts`                           | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Assignment APIs exist and tests pass.                  |
| Catalog          | `/api/catalog/:resource`, `/api/catalog/:resource/:id`                                           | GET/POST/PATCH/DELETE | `apps/api/src/routes/catalog.routes.ts`                         | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Covers asset catalog resources.                        |
| Assets           | `/api/assets`, `/api/assets/:id`, `/api/assets/:id/lifecycle`                                    | GET/POST/PATCH        | `apps/api/src/routes/assets.routes.ts`                          | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Asset registry and lifecycle routes exist.             |
| Attachments      | `/api/assets/:id/attachments`, download/delete variants                                          | GET/POST/DELETE       | `apps/api/src/routes/assets.routes.ts`                          | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | PARTIAL | No checksum/presigned URL contract.                    |
| Locations        | `/api/locations/*`                                                                               | GET/POST/PATCH/DELETE | `apps/api/src/routes/locations.routes.ts`                       | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Location APIs and tests exist.                         |
| Stock            | `/api/stock/items`, `/api/stock/units`, `/api/stock/movements`                                   | GET/POST              | `apps/api/src/routes/stock.routes.ts`                           | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Stock service and integration tests pass.              |
| Custody          | `/api/custody/checkouts`, `/api/custody/checkins`, `/api/custody/handovers`                      | POST                  | `apps/api/src/routes/custody.routes.ts`                         | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Custody workflows exist.                               |
| Transfers        | `/api/transfers`, `/api/transfers/:id/decision`                                                  | GET/POST              | `apps/api/src/routes/transfers.routes.ts`                       | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Transfer workflow exists.                              |
| Maintenance      | `/api/maintenance/tickets`, `/api/maintenance/tickets/:id/status`, `/api/maintenance/warranties` | GET/POST/PATCH        | `apps/api/src/routes/maintenance.routes.ts`                     | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Tickets and warranties exist.                          |
| Audits           | `/api/audits/campaigns`, `/api/audits/scans`                                                     | GET/POST              | `apps/api/src/routes/audits.routes.ts`                          | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Audit campaign/scan APIs exist.                        |
| Imports          | `/api/imports/jobs`, `/api/imports/jobs/:id/process`                                             | GET/POST              | `apps/api/src/routes/imports.routes.ts`                         | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | PARTIAL | Route exists; async worker runtime is not complete.    |
| Reports          | `/api/reports/exports`, `/api/reports/exports/:id/download`, `/api/reports/filters`              | GET/POST              | `apps/api/src/routes/reports.routes.ts`                         | Yes        | Yes             | Yes            | Yes                | Yes       | Yes   | READY   | Export and saved-filter APIs exist.                    |
| OpenAPI/docs     | `/api/openapi.json`, `/api/docs`                                                                 | GET                   | `apps/api/src/app.ts`, `apps/api/src/plugins/swagger.plugin.ts` | Partial    | Public/internal | N/A            | N/A                | N/A       | Smoke | PARTIAL | Paths exist; component schemas are absent.             |

## D. Auth/RBAC/Tenant Audit

| Auth/RBAC area            | Status  | Evidence                                                                                 | Risk   | Notes                                                                             |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Session model             | READY   | `packages/db/src/schema/auth.ts`, `packages/auth/src/sessions.ts`                        | Low    | Session repository and cookies are used.                                          |
| Login/logout/me           | READY   | `apps/api/src/routes/auth.routes.ts`                                                     | Low    | Smoke check for unauthenticated `/me` returned typed 401.                         |
| Password hashing          | READY   | `packages/auth/src/passwords.ts`                                                         | Low    | Scrypt-based hashing and timing-safe compare.                                     |
| Permission matrix         | READY   | `packages/auth/src/sessions.ts`, `packages/db/src/seed.ts`                               | Low    | Seed provisions permissions/roles.                                                |
| Role/user APIs            | READY   | `apps/api/src/routes/admin.routes.ts`, `packages/auth/src/admin.ts`                      | Low    | Mutation APIs exist.                                                              |
| Assignment APIs           | READY   | `apps/api/src/routes/admin.routes.ts`, `packages/db/src/repositories/rbac.repository.ts` | Low    | Assignment create/delete exists.                                                  |
| Route guards              | READY   | `apps/api/src/http/permissions.ts`, `apps/api/src/plugins/auth.plugin.ts`                | Low    | Protected routes check session and permissions.                                   |
| Tenant context            | READY   | `apps/api/src/plugins/auth.plugin.ts`, `packages/auth/src/sessions.ts`                   | Low    | Tenant comes from session/user context.                                           |
| Cross-tenant denial tests | READY   | `tests/integration/auth-rbac.test.ts`                                                    | Low    | DB-backed tests passed.                                                           |
| Scoped permissions        | PARTIAL | `packages/db/src/schema/rbac.ts`                                                         | Medium | Scope fields exist, but deeper department/site UX semantics need product signoff. |
| Default admin credentials | READY   | `packages/db/src/seed.ts`, `.env.example`                                                | Low    | Seed does not create usable default app admin credentials.                        |
| Security audit logs       | READY   | `packages/auth/src/sessions.ts`, `packages/auth/src/admin.ts`                            | Low    | Sensitive auth/admin actions log audit entries.                                   |

## E. Storage/MinIO Audit

| Storage feature           | Status  | Evidence                                                                                    | Risk   | Notes                                                         |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------- |
| MinIO client              | READY   | `packages/storage/src/minio-client.ts`                                                      | Low    | Health and object operations exist.                           |
| Object key helper         | READY   | `packages/storage/src/object-keys.ts`                                                       | Low    | Centralized tenant-prefixed key generation.                   |
| Bucket init               | READY   | `infra/minio/init-bucket.sh`, `infra/docker-compose.dev.yml`                                | Low    | Dev bucket init exists.                                       |
| Upload route              | READY   | `apps/api/src/routes/assets.routes.ts`, `packages/core/src/assets/asset-service.ts`         | Low    | Upload validates filename, content type, and size.            |
| Authorized download route | READY   | `apps/api/src/routes/assets.routes.ts`, `packages/core/src/assets/asset-service.ts`         | Low    | Streaming authorized download exists.                         |
| Presigned URL route       | MISSING | No dedicated presigned route found                                                          | Medium | Not required if streaming-only contract is accepted.          |
| Delete/soft-delete        | READY   | `packages/core/src/assets/asset-service.ts`                                                 | Low    | Object delete and metadata delete path exist.                 |
| Attachment metadata       | READY   | `packages/db/src/schema/assets.ts`                                                          | Low    | Metadata is stored in PostgreSQL.                             |
| Export download           | READY   | `packages/core/src/reporting/reporting-service.ts`, `apps/api/src/routes/reports.routes.ts` | Low    | Export download path exists.                                  |
| MIME/size policy          | READY   | `packages/storage/src/policies.ts`                                                          | Low    | MIME allowlist and max size exist.                            |
| Checksum policy           | MISSING | No storage checksum implementation found                                                    | Medium | Add checksum capture before production file integrity claims. |
| Unsafe filename handling  | READY   | `packages/storage/src/policies.ts`, `object-keys.ts`                                        | Low    | Filename and key sanitization exist.                          |
| Permission checks         | READY   | `packages/core/src/assets/asset-service.ts`                                                 | Low    | Attachment operations resolve session/permissions.            |
| Tests                     | READY   | `apps/api/src/tests/storage-routes.test.ts`, `tests/integration/assets.test.ts`             | Low    | Tests passed.                                                 |

## F. Valkey/Jobs Audit

| Valkey/job feature         | Status  | Evidence                                                                                                                            | Risk   | Notes                                                                               |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Valkey client              | READY   | `packages/cache/src/valkey-client.ts`                                                                                               | Low    | Client wrapper exists.                                                              |
| Health check               | READY   | `packages/cache/src/index.ts`, `/api/health/ready`                                                                                  | Low    | Readiness smoke check passed.                                                       |
| Rate limiting              | PARTIAL | `packages/cache/src/rate-limit.ts`, `packages/core/src/security/rate-limit-service.ts`, `apps/api/src/plugins/rate-limit.plugin.ts` | Medium | Login rate limiting exists; Fastify plugin is a placeholder.                        |
| Distributed locks          | READY   | `packages/cache/src/locks.ts`                                                                                                       | Low    | Tested primitive exists.                                                            |
| Idempotency                | READY   | `packages/cache/src/idempotency.ts`                                                                                                 | Low    | Tested primitive exists.                                                            |
| Queue primitive            | PARTIAL | `packages/cache/src/queue.ts`                                                                                                       | Medium | Primitive exists; worker runtime is absent.                                         |
| Workers                    | MISSING | `apps/api/src/workers/README.md`                                                                                                    | Medium | No actual worker process, retry loop, or dead-letter flow.                          |
| Import/export jobs         | PARTIAL | `apps/api/src/routes/imports.routes.ts`, `packages/core/src/reporting/reporting-service.ts`                                         | Medium | Synchronous/process routes exist; background processing is not production-complete. |
| Stock movement idempotency | PARTIAL | `packages/core/src/stock/stock-service.ts`, `packages/cache/src/idempotency.ts`                                                     | Medium | Idempotency primitive exists; verify per-mutation behavior as flows grow.           |
| Tests                      | READY   | `packages/cache/src/cache-primitives.test.ts`, `RUN_DB_TESTS=1 pnpm test`                                                           | Low    | Cache primitive tests passed.                                                       |

## G. Infra/Deployment Audit

| Infra area                | Status  | Evidence                                                                                                                                                        | Missing                           | Risk   |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------ |
| Docker dev compose        | READY   | `infra/docker-compose.dev.yml`                                                                                                                                  | None found                        | Low    |
| PostgreSQL service        | READY   | `infra/docker-compose.dev.yml`                                                                                                                                  | None found                        | Low    |
| Valkey service            | READY   | `infra/docker-compose.dev.yml`                                                                                                                                  | None found                        | Low    |
| MinIO and init            | READY   | `infra/docker-compose.dev.yml`, `infra/minio/init-bucket.sh`                                                                                                    | None found                        | Low    |
| Mailpit                   | READY   | `infra/docker-compose.dev.yml`                                                                                                                                  | None found                        | Low    |
| Prometheus/Grafana/OTel   | PARTIAL | `infra/prometheus/prometheus.yml`, `infra/grafana/**`, `infra/otel/collector-config.yml`                                                                        | Naming/target cleanup             | Medium |
| Production Dockerfile     | PARTIAL | `infra/Dockerfile.api`                                                                                                                                          | Remove web package copy           | Medium |
| Production compose        | PARTIAL | `infra/docker-compose.prod.yml`                                                                                                                                 | Provide validation env invocation | Medium |
| Env examples              | READY   | `.env.example`, `infra/env.production.example`                                                                                                                  | None found                        | Low    |
| Volumes/health checks     | READY   | `infra/docker-compose.dev.yml`, `docker compose ... ps`                                                                                                         | None found                        | Low    |
| Backup/restore            | READY   | `scripts/backup-dev.sh`, `scripts/restore-dev.sh`, `docs/operations/BACKUP_RESTORE.md`                                                                          | None found                        | Low    |
| Air-gap/offline packaging | READY   | `scripts/build-offline-pnpm-store.sh`, `scripts/export-release-images.sh`, `docs/operations/OFFLINE_RELEASE_BUNDLE.md`, `docs/operations/AIR_GAP_DEPLOYMENT.md` | None found                        | Low    |
| No cloud-only dependency  | READY   | `scripts/check-forbidden-deps.mjs`, command result                                                                                                              | None found                        | Low    |
| Rollback/release docs     | READY   | `docs/operations/RELEASE_CHECKLIST.md`, `docs/operations/PRODUCTION_DEPLOYMENT.md`                                                                              | None found                        | Low    |

## H. Observability Audit

| Observability area      | Status  | Evidence                                                                            | Missing                       | Risk   |
| ----------------------- | ------- | ----------------------------------------------------------------------------------- | ----------------------------- | ------ |
| Live health             | READY   | `apps/api/src/routes/health.routes.ts`                                              | None found                    | Low    |
| Ready health            | READY   | `apps/api/src/routes/health.routes.ts`                                              | None found                    | Low    |
| Metrics endpoint        | READY   | `apps/api/src/routes/metrics.routes.ts`, `packages/telemetry/src/metrics.ts`        | None found                    | Low    |
| Structured logging      | READY   | `packages/telemetry/src/logger.ts`, `apps/api/src/plugins/logger.plugin.ts`         | None found                    | Low    |
| Request IDs             | READY   | `packages/telemetry/src/request-id.ts`, `apps/api/src/plugins/request-id.plugin.ts` | None found                    | Low    |
| OTel config             | READY   | `infra/otel/collector-config.yml`                                                   | None found                    | Low    |
| Prometheus config       | PARTIAL | `infra/prometheus/prometheus.yml`                                                   | Fastify naming/target cleanup | Medium |
| Grafana dashboards      | READY   | `infra/grafana/dashboards/*.json`                                                   | None found                    | Low    |
| Alerts/runbooks         | READY   | `docs/operations/OBSERVABILITY_AND_ALERTS.md`                                       | None found                    | Low    |
| Domain/business metrics | PARTIAL | `packages/telemetry/src/metrics.ts`                                                 | More flow-specific metrics    | Medium |
| Error logging           | READY   | `apps/api/src/plugins/error.plugin.ts`, `apps/api/src/http/responses.ts`            | None found                    | Low    |

## I. Testing Audit

| Test area                  | Exists  | Command                                                                                            | Passed/Failed   | Coverage quality | Notes                                                        |
| -------------------------- | ------- | -------------------------------------------------------------------------------------------------- | --------------- | ---------------- | ------------------------------------------------------------ |
| Unit tests                 | Yes     | `pnpm check`, `RUN_DB_TESTS=1 pnpm test`                                                           | Passed          | Good             | Package-level tests exist.                                   |
| Integration tests          | Yes     | `RUN_DB_TESTS=1 pnpm test`                                                                         | Passed          | Good             | 19 files, 60 tests passed.                                   |
| DB tests                   | Yes     | `RUN_DB_TESTS=1 pnpm test`                                                                         | Passed          | Good             | DB foundation and repository-backed tests exist.             |
| Migration tests            | Yes     | `pnpm db:migrate`                                                                                  | Passed          | Good             | Migration applied successfully.                              |
| Seed idempotency tests     | Yes     | `pnpm db:seed` twice, `tests/integration/seed-idempotency.test.ts`                                 | Passed          | Good             | Seed is idempotent.                                          |
| API route/contract tests   | Yes     | `pnpm test:api`                                                                                    | Passed          | Good             | Includes route parity tests.                                 |
| Auth/RBAC tests            | Yes     | `tests/integration/auth-rbac.test.ts`, `apps/api/src/tests/auth-routes.test.ts`                    | Passed          | Good             | Permission and session areas covered.                        |
| Storage tests              | Yes     | `apps/api/src/tests/storage-routes.test.ts`, `tests/integration/assets.test.ts`                    | Passed          | Good             | Attachment flows covered.                                    |
| Valkey tests               | Yes     | `packages/cache/src/cache-primitives.test.ts`                                                      | Passed          | Good             | Primitive coverage exists.                                   |
| Production packaging tests | Partial | `docker build -f infra/Dockerfile.api .`, `docker compose -f infra/docker-compose.prod.yml config` | Mixed           | Medium           | Build passed; compose config failed without required env.    |
| Smoke tests                | Yes     | Endpoint curl checks                                                                               | Passed          | Good             | Health, ready, metrics, ops, docs, OpenAPI, auth/me checked. |
| E2E/manual QA docs         | Yes     | `docs/QA`, `docs/operations`, `docs/engineering/TESTING_GATES.md`                                  | Not command-run | Good             | Docs exist.                                                  |

## J. Security/License Audit

| Security area                       | Status  | Evidence                                                                                        | Risk   | Notes                                                              |
| ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| No Prisma                           | READY   | `pnpm check:forbidden`, `package.json`, workspace manifests                                     | Low    | Forbidden check passed.                                            |
| No Supabase runtime                 | READY   | `pnpm check:forbidden`                                                                          | Low    | Forbidden check passed.                                            |
| No Firebase                         | READY   | `pnpm check:forbidden`                                                                          | Low    | Forbidden check passed.                                            |
| No MongoDB/Mongoose                 | READY   | `pnpm check:forbidden`                                                                          | Low    | Forbidden check passed.                                            |
| No Neon serverless runtime          | READY   | `pnpm check:forbidden`                                                                          | Low    | Forbidden check passed.                                            |
| No paid SaaS core dependency        | READY   | Package manifest inspection, forbidden check                                                    | Low    | No such core dependency found.                                     |
| No copied AGPL/Elastic/O'Saasy code | PARTIAL | `repo-audit` excluded from product tree; source review did not show reference repo copies       | Medium | Full provenance review is manual; no obvious copied source found.  |
| No committed secrets                | READY   | `.gitignore`, `.env.example`, `git ls-files .env` behavior from review                          | Low    | `.env` is local and ignored; examples use dev/placeholders.        |
| Session secret required             | READY   | `packages/config/src/index.ts`                                                                  | Low    | Env validation is centralized.                                     |
| Upload limits                       | READY   | `packages/storage/src/policies.ts`                                                              | Low    | MIME and size limits exist.                                        |
| Rate limiting                       | PARTIAL | `packages/core/src/security/rate-limit-service.ts`, `apps/api/src/plugins/rate-limit.plugin.ts` | Medium | Auth rate limiting exists; global plugin is placeholder.           |
| Security headers                    | READY   | `apps/api/src/plugins/security.plugin.ts`, endpoint smoke headers                               | Low    | Helmet/CORS/cookie plugins registered.                             |
| CORS                                | READY   | `apps/api/src/plugins/security.plugin.ts`                                                       | Low    | Configured for Fastify.                                            |
| Error responses                     | READY   | `apps/api/src/http/responses.ts`                                                                | Low    | Typed error envelope includes request ID and avoids raw DB errors. |
| Sensitive mutation audit logs       | READY   | `packages/auth/src/admin.ts`, `packages/core/src/**`                                            | Low    | Audit writes exist across key workflows.                           |
| Release status                      | PARTIAL | `git status --short`                                                                            | Medium | Worktree is not release-clean.                                     |

## Evidence Appendix

- `AGENTS.md`
- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `apps/api/src/http/responses.ts`
- `apps/api/src/http/permissions.ts`
- `apps/api/src/plugins/*.ts`
- `apps/api/src/routes/*.routes.ts`
- `apps/api/src/tests/*.test.ts`
- `apps/web/package.json`
- `apps/web/app/api/**/route.ts`
- `infra/Dockerfile.api`
- `infra/docker-compose.dev.yml`
- `infra/docker-compose.prod.yml`
- `infra/env.production.example`
- `infra/prometheus/prometheus.yml`
- `infra/grafana/**`
- `infra/otel/collector-config.yml`
- `infra/minio/init-bucket.sh`
- `packages/auth/src/*.ts`
- `packages/cache/src/*.ts`
- `packages/config/src/index.ts`
- `packages/core/src/**/*.ts`
- `packages/db/src/schema/*.ts`
- `packages/db/src/repositories/*.ts`
- `packages/db/src/migrations/*.sql`
- `packages/db/src/seed.ts`
- `packages/storage/src/*.ts`
- `packages/telemetry/src/*.ts`
- `tests/integration/*.test.ts`
- `docs/engineering/API_CONTRACT.md`
- `docs/engineering/FRONTEND_HANDOFF.md`
- `docs/engineering/BACKEND_ONLY_FASTIFY_SHIP_READINESS_AUDIT.md`
- `docs/engineering/backend-migration/FASTIFY_MIGRATION_COMPLETION_REPORT.md`
- `docs/operations/*.md`

## Exact Next Actions

1. Complete backend-only migration cleanup: remove or quarantine legacy Next API routes after parity signoff, switch root `dev`/`build` defaults to API/backend commands, and update `AGENTS.md`.
2. Fix API packaging ownership: remove `apps/web/package.json` from `infra/Dockerfile.api`, rerun `docker build -f infra/Dockerfile.api .`, and document the production compose config command with an env file.
3. Add OpenAPI request/response schemas for all Fastify routes and add a test that fails when `/api/openapi.json` has zero component schemas.
4. Implement production worker runtime for import/export jobs with retry, dead-letter handling, observability, and tests.
5. Harden file workflows with checksum metadata, documented streaming-vs-presigned download policy, and transaction/compensation handling for object-store plus DB writes.
6. Replace placeholder global rate-limit plugin behavior or explicitly document that only auth-sensitive routes use rate limiting in this phase.
7. Align Prometheus scrape job names/targets with Fastify API deployment and add business metrics for imports, exports, asset mutations, and storage operations.
8. Clean release state: commit or intentionally remove generated/untracked files, then rerun `pnpm check`, `pnpm build:api`, `pnpm test:api`, `RUN_DB_TESTS=1 pnpm test`, Docker build, and production compose config validation.

## Final Answer

```text
Backend/DB/Infra readiness: 88%
Verdict: MOSTLY READY, BUT BLOCKERS REMAIN
Frontend can start: partially, Fastify APIs are broadly usable but backend-only release ownership and a few backend contract gaps still need closure
```
