# Backend, Database, And Infrastructure Ship Readiness Audit

Audit date: 2026-05-16  
Audit scope: backend APIs/server actions, core services, database, infrastructure, deployment, security, testing, observability, and documentation. Frontend visual completeness is explicitly out of scope.

## Final Verdict

**MOSTLY READY, BUT BLOCKERS REMAIN**

The project has a substantial working backend/database foundation: Drizzle reports **47 tables**, migrations apply to an empty database and the existing dev database, seed is idempotent, Docker dev services run, all requested release-gate commands passed after sandbox-only localhost/Turbopack restrictions were bypassed, and live health/readiness/metrics endpoints returned 200.

It is **not fully ready to ship as backend/db/infra** because several non-visual backend and operations capabilities are missing or only scaffolded:

- File storage is upload-only: no authorized download/presigned URL route, no delete/soft-delete helper, and no upload size/MIME enforcement.
- Valkey is only used for health and login rate limiting; lock, idempotency, queue/job primitives are not implemented.
- Admin/user/RBAC mutation APIs are missing, so operators cannot create/update users, assign roles, or reset passwords through backend APIs.
- Location management has schema and repositories, but no core service or API endpoints.
- Production deployment is documented, but no production Compose/Kubernetes/systemd packaging, image bundle manifest, or offline pnpm-store build artifact exists in the repo.

## Executive Summary

- Backend readiness: **PARTIAL**. Core services and route handlers exist for major workflows, but admin mutations, location APIs, file download/delete, and background job primitives are missing.
- DB readiness: **READY with minor risks**. Schema, migrations, indexes, FKs, tenant IDs, seed, and tests are strong. Migration gates passed on existing and empty DBs.
- Infra readiness: **PARTIAL**. Dev Docker Compose is solid; production/on-prem packaging is not complete.
- Auth/RBAC readiness: **PARTIAL**. Login/session/permission checks work, but user/role lifecycle APIs are list-only.
- Storage readiness: **PARTIAL**. MinIO upload and bucket setup work; download/delete and upload policy controls are missing.
- Valkey readiness: **PARTIAL**. Client, health check, and login rate limit exist; locks, idempotency helpers, queues, and job workers do not.
- Observability readiness: **PARTIAL**. Health/readiness/metrics/logging exist; business-flow metrics and alert rule artifacts are limited.
- Testing readiness: **PARTIAL**. Unit/integration/DB tests are good and passed; automated route-handler/e2e API smoke coverage is missing.
- Deployment readiness: **PARTIAL**. Air-gap docs exist; production packaging, secret handling, and restore rehearsal remain gaps.

## Critical Blockers

1. **File retrieval is missing**  
   Evidence: upload exists in `packages/storage/src/minio-client.ts` and `apps/web/app/api/assets/[id]/attachments/route.ts`, but `GetObject`, presigned URL, download route, and delete/soft-delete helpers are absent. `docs/engineering/API_CONTRACT.md` lists attachment download and report download APIs as not implemented.

2. **Valkey lock/idempotency/queue/job layer is incomplete**  
   Evidence: `packages/cache/src/valkey-client.ts` and `packages/cache/src/rate-limit.ts` implement client and rate limiting only. No `locks.ts`, `idempotency.ts`, `queue.ts`, or worker package exists. `AGENTS.md` and `docs/operations/AIR_GAP_DEPLOYMENT.md` require Valkey for queues, locks, idempotency, and rate limits.

3. **Admin/user/RBAC lifecycle backend is incomplete**  
   Evidence: `packages/auth/src/sessions.ts` exposes `listUsersForSession`, `listRolesForSession`, and `listAssignmentsForSession`; route handlers under `apps/web/app/api/admin/**` are GET-only. No API exists for user creation, password reset, role assignment mutation, or role permission editing.

4. **Location management backend API is missing**  
   Evidence: schema and repositories exist in `packages/db/src/schema/locations.ts` and `packages/db/src/repositories/locations.repository.ts`, but there is no `packages/core/src/locations` service and no `apps/web/app/api/locations/**` route.

5. **Production deployment package is not complete**  
   Evidence: `infra/docker-compose.dev.yml` is dev-only; `docs/operations/AIR_GAP_DEPLOYMENT.md` describes required image/store transfer steps, but the repo does not contain a production Compose file, Dockerfile, release image manifest generator, offline pnpm-store script, or production secret template.

## High-Priority Gaps

- Upload policy is weak: no max file size, allowed MIME list, checksum, malware-scan hook, or content-disposition policy in `apps/web/app/api/assets/[id]/attachments/route.ts` or `packages/storage/src/minio-client.ts`.
- Export jobs write MinIO objects in `packages/core/src/reporting/reporting-service.ts`, but there is no authorized export download endpoint.
- Stock movement accepts `idempotencyKey`, and the DB has a unique index, but `packages/core/src/stock/stock-service.ts` does not return an existing ledger entry on duplicate idempotency key; duplicate submissions can become DB errors instead of typed idempotent responses.
- Reporting overview reads require `audits.read`, `imports.read`, and `reports.read` together in `packages/core/src/reporting/reporting-service.ts`; this is stricter than separate module read permissions and may block least-privilege frontend screens.
- Raw DB constraint conflicts are hidden from clients as generic `internal_error` by `apps/web/lib/api/responses.ts`; duplicate asset/catalog/user conflicts are tested at service level but not consistently translated into frontend-friendly `409` errors.
- `.env.example` and `infra/docker-compose.dev.yml` contain local default service credentials (`minioadmin`, Grafana `admin/admin`). These are dev-friendly but not production-safe placeholders.
- `apps/web/next.config.mjs` CSP uses `unsafe-inline` and `unsafe-eval`, which should be tightened for production after build/runtime requirements are known.
- Next.js build emits a deprecation warning for `apps/web/middleware.ts`; docs already mark migration to `proxy.ts` as future hardening.
- No automated restore test was run. `scripts/restore-dev.sh` has a destructive guard, and docs require isolated restore rehearsal before release.
- `git status --short` shows many modified/untracked product files; a release needs a clean commit/tag before packaging.

## Medium/Low-Priority Gaps

- No full CSV/XLSX parser; imports currently accept row arrays/JSON payloads.
- No background worker retry orchestration for imports/exports.
- No production identity-provider integration; password auth is local DB-backed.
- No E2E tests under `tests/e2e` beyond `.gitkeep`.
- Metrics are mostly default Node/process metrics; there are no domain counters/histograms for auth, asset mutations, stock movements, imports, exports, and storage writes.
- Backup scripts are dev/local scripts; production backup scheduling and retention are operator-documented but not automated.

## A. Project Structure And Governance

Status: **READY with release hygiene risk**

Evidence:

- Monorepo structure exists: `apps/web`, `packages/{auth,cache,config,core,db,storage,telemetry}`, `infra`, `docs`, `tests`.
- Governance exists: `AGENTS.md`, `docs/engineering/FOLDER_AND_BOUNDARY_RULES.md`, `docs/engineering/DB_DRIZZLE_RULES.md`, `docs/engineering/BACKEND_API_RULES.md`, `docs/engineering/FEATURE_IMPLEMENTATION_WORKFLOW.md`.
- Roadmap/progress exist: `docs/engineering/MASTER_PRODUCT_ROADMAP.md`, `docs/engineering/PROJECT_PROGRESS.md`.
- Feature docs exist for phases 2-9 under `docs/engineering/features/`.
- API contract exists: `docs/engineering/API_CONTRACT.md`.
- ESLint boundary rules exist: `eslint.config.mjs`.
- Forbidden dependency checker exists: `scripts/check-forbidden-deps.mjs`.
- No cloned reference repos or `repo-audit` folder were found inside `custivio`.
- No `.DS_Store`, `__MACOSX`, `.tmp`, `.bak`, `.old`, `.orig`, or `repo-audit` cleanup candidates were found by static search.

Risks:

- `git status --short` shows many modified/untracked files. This is acceptable for active development but not release-ready until committed/tagged.
- `../.playwright-mcp/` is untracked outside the product repo; not inside production source.

## B. Database Readiness

Status: **READY**

Evidence:

- Drizzle config: `packages/db/drizzle.config.ts`.
- DB client: `packages/db/src/client.ts`.
- Migration runner: `packages/db/src/migrate.ts`.
- Seed: `packages/db/src/seed.ts`.
- Modular schema: `packages/db/src/schema/*.ts`.
- Repository layer: `packages/db/src/repositories/*.ts`.
- Migrations: `packages/db/src/migrations/0000_solid_lucky_pierre.sql` through `0005_nervous_lord_tyger.sql`, with snapshot metadata.

Tables found by `pnpm db:generate`: **47**

- Tenant/org/user/RBAC: `tenants`, `organizations`, `departments`, `users`, `permissions`, `roles`, `role_permissions`, `user_role_assignments`.
- Auth: `password_credentials`, `sessions`.
- Locations: `sites`, `buildings`, `floors`, `rooms`, `racks`, `shelves`, `bins`.
- Catalog: `asset_categories`, `asset_types`, `custom_field_definitions`, `manufacturers`, `asset_models`, `vendors`.
- Assets: `assets`, `asset_identifiers`, `asset_attachments`, `asset_lifecycle_events`.
- Stock: `stock_units`, `stock_items`, `stock_balances`, `stock_ledger_entries`, `stock_adjustments`, `stock_transfers`, `stock_low_stock_rules`.
- Operations: `asset_custody_assignments`, `asset_transfer_requests`, `asset_maintenance_tickets`, `asset_maintenance_events`, `asset_warranties`.
- Reporting/import/export: `audit_campaigns`, `audit_scan_results`, `audit_findings`, `import_jobs`, `import_job_rows`, `export_jobs`, `saved_filters`.
- Audit logs: `audit_logs`.

Readiness checks:

- Modular schema exists and is organized by domain.
- Tenant-owned schema modules include `tenantId`/`tenant_id` except global `permissions` and root `tenants`.
- Common indexes and unique constraints exist for tenant/status/type/location/custodian/serial/asset tag/SKU/date-like fields where implemented.
- Foreign keys exist across tenant-owned domain tables.
- Audit logs are append-only at repository level: `packages/db/src/repositories/audit.repository.ts` exposes append/list, not update/delete.
- Empty DB migration check passed using temporary database `eip_audit_empty`.
- Existing dev DB migration check passed.
- `pnpm db:seed` passed twice.
- `tests/integration/seed-idempotency.test.ts` passed with `RUN_DB_TESTS=1`.

Missing DB tables:

- No explicit Valkey-backed job/queue tracking tables; not necessarily required if jobs are purely Valkey-backed, but no queue worker exists either.
- No notification tables; notification/job service is not implemented.

DB risks:

- Some uniqueness conflicts rely on raw PostgreSQL constraint errors instead of typed domain errors.
- `stock_ledger_entries.idempotency_key` has a unique index but the stock service does not implement idempotent replay behavior.

DB ship-ready except frontend: **Yes, with minor service-layer error mapping risks.**

## C. Backend Service Readiness

Status: **PARTIAL**

| Module                       | Status  | Evidence                                                                                                         | Notes                                                                                                      |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Tenant/org service           | PARTIAL | `packages/db/src/repositories/tenants.repository.ts`, `packages/db/src/repositories/organizations.repository.ts` | Repositories exist; no core service or API for tenant/org management.                                      |
| User service                 | PARTIAL | `packages/auth/src/sessions.ts`, `apps/web/app/api/admin/users/route.ts`                                         | Session and list APIs exist; no create/update/password reset API.                                          |
| RBAC service                 | PARTIAL | `packages/db/src/repositories/rbac.repository.ts`, `packages/auth/src/sessions.ts`                               | Permission checks and list APIs exist; no mutation endpoints.                                              |
| Location service             | PARTIAL | `packages/db/src/schema/locations.ts`, `packages/db/src/repositories/locations.repository.ts`                    | Schema/repositories exist; no core service/API route.                                                      |
| Asset catalog service        | READY   | `packages/core/src/catalog/catalog-service.ts`, `apps/web/app/api/catalog/**`                                    | Validation, permission checks, audit logs, and tests exist.                                                |
| Asset registry service       | PARTIAL | `packages/core/src/assets/asset-service.ts`, `apps/web/app/api/assets/**`                                        | CRUD/detail/upload/lifecycle exist; identifier route, download, delete, size/MIME limits missing.          |
| Attachment/storage service   | PARTIAL | `packages/storage/src/minio-client.ts`, `packages/storage/src/object-keys.ts`                                    | Centralized object keys and upload exist; no get/delete/presign helpers.                                   |
| Inventory/stock service      | PARTIAL | `packages/core/src/stock/stock-service.ts`, `packages/db/src/repositories/stock.repository.ts`                   | Ledger/balance transactions exist; Valkey idempotency/typed duplicate handling missing.                    |
| Custody/movement service     | READY   | `packages/core/src/operations/operations-service.ts`, `packages/db/src/repositories/custody.repository.ts`       | Checkout/checkin/handover/transfers use permissions, transactions, audit logs, tests.                      |
| Maintenance service          | READY   | `packages/core/src/operations/operations-service.ts`, `packages/db/src/repositories/maintenance.repository.ts`   | Tickets/status/warranties use permissions, transactions, audit logs, tests.                                |
| Audit service                | READY   | `packages/core/src/reporting/reporting-service.ts`, `packages/db/src/repositories/reporting.repository.ts`       | Campaigns/scans/findings implemented.                                                                      |
| Import/export/report service | PARTIAL | `packages/core/src/reporting/reporting-service.ts`                                                               | Preview/process/export/filter implemented; no file download, full CSV/XLSX parsing, or background workers. |
| Notification/job service     | MISSING | No package/service found                                                                                         | Roadmap marks background queues out of scope, but hard requirements mention Valkey queues/jobs.            |

Backend risks:

- Route handlers are generally thin and call core/auth services.
- Input validation exists, but mostly through hand-written validators rather than Zod schemas.
- Typed domain errors exist, but repository-level DB errors can still become generic `internal_error`.
- Audit logging exists for important mutations in auth/catalog/assets/stock/operations/reporting.

## D. API / Server Action Readiness

Status: **PARTIAL**

| Area        | Endpoint/action                        | Method/type    | Validation                   | Auth            | Permission                                                | Tenant check       | Audit                 | Tests                            | Status  | Notes                                                   |
| ----------- | -------------------------------------- | -------------- | ---------------------------- | --------------- | --------------------------------------------------------- | ------------------ | --------------------- | -------------------------------- | ------- | ------------------------------------------------------- |
| Health      | `/api/health/live`                     | GET            | N/A                          | Public          | N/A                                                       | N/A                | N/A                   | health test + live curl          | READY   | Returned 200.                                           |
| Health      | `/api/health/ready`                    | GET            | N/A                          | Public          | N/A                                                       | Dependency-scoped  | N/A                   | health test + live curl          | READY   | Returned 200 with Postgres/Valkey/MinIO ready.          |
| Metrics     | `/api/metrics`                         | GET            | N/A                          | Public          | N/A                                                       | N/A                | N/A                   | live curl                        | READY   | Prometheus text returned.                               |
| Ops         | `/api/ops/status`                      | GET            | N/A                          | Public          | N/A                                                       | N/A                | N/A                   | production-hardening test + curl | READY   | Returns dependency state/runbooks.                      |
| Auth        | `/api/auth/login`                      | POST           | Manual field parsing         | Public          | N/A                                                       | Tenant slug lookup | login success/failure | auth tests                       | READY   | Rate limited through Valkey.                            |
| Auth        | `/api/auth/logout`                     | POST           | N/A                          | Optional cookie | N/A                                                       | Session tenant     | logout                | auth tests                       | READY   | Revokes session.                                        |
| Auth        | `/api/auth/me`                         | GET            | N/A                          | Required        | N/A                                                       | Session tenant     | N/A                   | auth tests                       | READY   | Returns session/permissions.                            |
| Admin       | `/api/admin/users`                     | GET            | N/A                          | Required        | `users.manage`                                            | Yes                | N/A                   | auth tests                       | PARTIAL | List-only.                                              |
| Admin       | `/api/admin/roles`                     | GET            | N/A                          | Required        | `roles.manage`                                            | Yes                | N/A                   | auth tests                       | PARTIAL | List-only.                                              |
| Admin       | `/api/admin/assignments`               | GET            | N/A                          | Required        | `roles.manage`                                            | Yes                | N/A                   | auth tests                       | PARTIAL | List-only.                                              |
| Catalog     | `/api/catalog/[resource]`              | GET/POST       | Manual domain validation     | Required        | `catalog.manage`                                          | Yes                | POST                  | catalog tests                    | READY   | No route-level automated test.                          |
| Catalog     | `/api/catalog/[resource]/[id]`         | PATCH/DELETE   | Manual domain validation     | Required        | `catalog.manage`                                          | Yes                | PATCH/DELETE          | catalog tests                    | READY   | Soft archive behavior.                                  |
| Assets      | `/api/assets`                          | GET/POST       | Manual domain validation     | Required        | `assets.read/write`                                       | Yes                | POST                  | assets tests                     | READY   | Duplicate DB errors not always typed.                   |
| Assets      | `/api/assets/[id]`                     | GET/PATCH      | Manual domain validation     | Required        | `assets.read/write`                                       | Yes                | PATCH                 | assets tests                     | READY   | Detail includes QR payload.                             |
| Assets      | `/api/assets/[id]/lifecycle`           | POST           | Manual domain validation     | Required        | `assets.write`                                            | Yes                | Yes                   | assets tests                     | READY   |                                                         |
| Assets      | `/api/assets/[id]/attachments`         | POST multipart | Minimal file presence        | Required        | `assets.write`                                            | Yes                | Yes                   | assets tests                     | PARTIAL | No size/MIME limit; no download/delete.                 |
| Stock       | `/api/stock/items`                     | GET/POST       | Manual domain validation     | Required        | `inventory.read/write`                                    | Yes                | POST                  | stock tests                      | READY   |                                                         |
| Stock       | `/api/stock/units`                     | POST           | Manual domain validation     | Required        | `inventory.write`                                         | Yes                | Yes                   | stock tests                      | READY   |                                                         |
| Stock       | `/api/stock/movements`                 | POST           | Manual domain validation     | Required        | `inventory.write`                                         | Yes                | Yes                   | stock tests                      | PARTIAL | DB idempotency key exists, but replay behavior missing. |
| Custody     | `/api/custody/checkouts`               | GET/POST       | Manual domain validation     | Required        | `custody.read/write`                                      | Yes                | POST                  | operations tests                 | READY   |                                                         |
| Custody     | `/api/custody/checkins`                | POST           | Manual domain validation     | Required        | `custody.write`                                           | Yes                | Yes                   | operations tests                 | READY   |                                                         |
| Custody     | `/api/custody/handovers`               | POST           | Manual domain validation     | Required        | `custody.write`                                           | Yes                | Yes                   | operations tests                 | READY   |                                                         |
| Transfers   | `/api/transfers`                       | GET/POST       | Manual domain validation     | Required        | `custody.read/write`                                      | Yes                | POST                  | operations tests                 | READY   |                                                         |
| Transfers   | `/api/transfers/[id]/decision`         | POST           | Manual domain validation     | Required        | `custody.write`                                           | Yes                | Yes                   | operations tests                 | READY   |                                                         |
| Maintenance | `/api/maintenance/tickets`             | GET/POST       | Manual domain validation     | Required        | `maintenance.read/write`                                  | Yes                | POST                  | operations tests                 | READY   |                                                         |
| Maintenance | `/api/maintenance/tickets/[id]/status` | POST           | Manual domain validation     | Required        | `maintenance.write`                                       | Yes                | Yes                   | operations tests                 | READY   |                                                         |
| Maintenance | `/api/maintenance/warranties`          | GET/POST       | Manual domain validation     | Required        | `maintenance.read/write`                                  | Yes                | POST                  | operations tests                 | READY   |                                                         |
| Audits      | `/api/audits/campaigns`                | GET/POST       | Manual domain validation     | Required        | GET requires combined overview perms; POST `audits.write` | Yes                | POST                  | reporting tests                  | PARTIAL | GET over-requires imports/reports read.                 |
| Audits      | `/api/audits/scans`                    | POST           | Manual domain validation     | Required        | `audits.write`                                            | Yes                | Yes                   | reporting tests                  | READY   |                                                         |
| Imports     | `/api/imports/jobs`                    | GET/POST       | Manual row/object validation | Required        | GET combined overview perms; POST `imports.write`         | Yes                | POST                  | reporting tests                  | PARTIAL | No CSV/XLSX parser/background worker.                   |
| Imports     | `/api/imports/jobs/[id]/process`       | POST           | Path ID                      | Required        | `imports.write`                                           | Yes                | Yes                   | reporting tests                  | READY   | Locked processing tested.                               |
| Reports     | `/api/reports/exports`                 | GET/POST       | Manual object validation     | Required        | GET combined overview perms; POST `reports.write`         | Yes                | POST                  | reporting tests                  | PARTIAL | Export creation only; no download API.                  |
| Reports     | `/api/reports/filters`                 | GET/POST       | Manual object validation     | Required        | GET combined overview perms; POST `reports.write`         | Yes                | POST                  | reporting tests                  | READY   |                                                         |

No direct Prisma/Supabase/Firebase/Mongo/Neon dependency was found by `pnpm check:forbidden`.

## E. Auth, RBAC, And Tenant Isolation

Status: **PARTIAL**

Ready evidence:

- Password hashing uses scrypt and timing-safe comparison in `packages/auth/src/passwords.ts`.
- Session tokens are random and stored as SHA-256 hashes via `hashSessionToken` in `packages/auth/src/passwords.ts`.
- Login/logout/current session are implemented in `packages/auth/src/sessions.ts` and `apps/web/app/api/auth/**`.
- Permission guard exists: `requirePermission` in `packages/auth/src/sessions.ts`.
- Seeded permission matrix and roles exist in `packages/db/src/seed.ts`.
- Tenant-scoped repositories exist across `packages/db/src/repositories`.
- Auth/RBAC tests passed in `tests/integration/auth-rbac.test.ts`.
- Cross-tenant same-email behavior is tested.
- Inactive/invalid user denial is tested.
- No default application admin credential is seeded in `packages/db/src/seed.ts`.

Partial/missing:

- No user creation/update/password reset APIs.
- No role mutation or assignment mutation APIs.
- Department/site scoped access is represented in schema (`scopeType`, `scopeId` in `user_role_assignments`) but not enforced in service guards beyond tenant-level permission checks.
- The local ignored `.env` currently contains a UAT admin email/password comment. It is ignored by `.gitignore`, but release process should avoid distributing local `.env`.

Production-ready auth/RBAC verdict: **Partial**.

## F. MinIO / File Storage Readiness

Status: **PARTIAL**

Ready evidence:

- MinIO/S3 client wrapper exists: `packages/storage/src/minio-client.ts`.
- Object key generation is centralized: `packages/storage/src/object-keys.ts`.
- Docker Compose starts MinIO: `infra/docker-compose.dev.yml`.
- MinIO init creates bucket and disables anonymous access: `infra/minio/init-bucket.sh`.
- Upload helper exists: `putObject` in `packages/storage/src/minio-client.ts`.
- Asset attachment metadata is stored in PostgreSQL: `packages/db/src/schema/assets.ts`.
- Exports write objects through MinIO in `packages/core/src/reporting/reporting-service.ts`.
- Files are not stored in the local app filesystem.
- Unsafe filename characters are replaced in `packages/storage/src/object-keys.ts`.
- Attachment upload checks `assets.write` permission in `packages/core/src/assets/asset-service.ts`.

Missing/risks:

- No download helper, presigned URL helper, or authorized download route.
- No delete/soft-delete helper.
- No file size limit.
- No MIME allowlist or content sniffing.
- No checksum or antivirus/malware scan extension point.
- Export object retrieval is not implemented.

## G. Valkey / Cache / Lock / Job Readiness

Status: **PARTIAL**

Ready evidence:

- Valkey client exists: `packages/cache/src/valkey-client.ts`.
- Docker Compose starts Valkey: `infra/docker-compose.dev.yml`.
- Health check exists: `checkValkeyHealth` in `packages/cache/src/index.ts`.
- Login rate limiting exists: `packages/cache/src/rate-limit.ts`, `packages/core/src/security/rate-limit-service.ts`, and `apps/web/app/api/auth/login/route.ts`.
- Rate-limit key non-PII behavior is tested in `tests/integration/production-hardening.test.ts`.
- Import/export duplicate processing is partially prevented by DB idempotency keys in `packages/core/src/reporting/reporting-service.ts`.

Missing/risks:

- No lock helper.
- No general idempotency helper.
- No queue primitive or background worker.
- No retry behavior implementation.
- Stock movement duplicate idempotency is not handled as replay.

Valkey layer verdict: **Only partially scaffolded, not complete.**

## H. Infrastructure And On-Prem Readiness

Status: **PARTIAL**

Ready evidence:

- Dev Compose includes PostgreSQL, Valkey, MinIO, MinIO init, Mailpit, OTel Collector, Prometheus, and Grafana: `infra/docker-compose.dev.yml`.
- Persistent volumes exist for Postgres, Valkey, MinIO, Prometheus, and Grafana.
- Health checks exist for Postgres, Valkey, and MinIO services.
- `.env.example` exists.
- No forbidden cloud-only runtime dependency was found.
- Air-gap notes exist: `docs/operations/AIR_GAP_DEPLOYMENT.md`.
- Backup/restore docs exist: `docs/operations/BACKUP_RESTORE.md`.
- Backup/restore scripts exist: `scripts/backup-dev.sh`, `scripts/restore-dev.sh`.
- Release docs exist: `docs/operations/RELEASE_CHECKLIST.md`.

Runtime check:

- `pnpm docker:dev` passed.
- `docker compose -f infra/docker-compose.dev.yml ps` showed Postgres, Valkey, MinIO, Mailpit, OTel, Prometheus, and Grafana running; Postgres/Valkey/MinIO/Mailpit reported healthy where health checks exist.

Missing/risks:

- Dev Compose only; no production Compose or deploy manifest.
- No Dockerfile/application image build definition.
- No release image manifest generator.
- No offline pnpm-store archive script.
- Default local service credentials are present in `.env.example` and Compose.
- Restore was not rehearsed as part of this audit because it is destructive to shared dev services.

On-prem dev readiness: **Ready**.  
On-prem staging/prod packaging readiness: **Partial**.

## I. Observability Readiness

Status: **PARTIAL**

Ready evidence:

- `/api/health/live` exists and returned 200.
- `/api/health/ready` exists and returned 200 with Postgres, Valkey, and MinIO OK.
- `/api/metrics` exists and returned Prometheus text.
- `/api/ops/status` exists and returned ready dependency state.
- Prometheus config exists: `infra/prometheus/prometheus.yml`.
- Grafana dashboards/provisioning exist: `infra/grafana/**`.
- OTel collector config exists: `infra/otel/collector-config.yml`.
- Structured JSON logger exists: `packages/telemetry/src/logger.ts`.
- Request ID helper exists: `packages/telemetry/src/request-id.ts`.
- Error response wrapper includes request IDs: `apps/web/lib/api/responses.ts`.

Gaps:

- Metrics are mostly default Node/process metrics; domain/business metrics are not implemented.
- No alert rule files are provisioned for Prometheus.
- OTel tracing API is configured externally, but app-level spans are not implemented.
- Error logs exist for unhandled API errors, but route duration/status logging middleware is not implemented.

## J. Testing Readiness

Status: **PARTIAL**

| Test area                  | Exists  | Command                                                 | Passed/Failed          | Coverage quality | Notes                                                                           |
| -------------------------- | ------- | ------------------------------------------------------- | ---------------------- | ---------------- | ------------------------------------------------------------------------------- |
| Install                    | Yes     | `pnpm install`                                          | Passed                 | Good             | Lockfile up to date.                                                            |
| Forbidden deps             | Yes     | `pnpm check:forbidden`                                  | Passed                 | Good             | Script scans package manifests/imports.                                         |
| Typecheck/lint/format/unit | Yes     | `pnpm check`                                            | Passed                 | Good             | DB tests skipped by design inside this command.                                 |
| Build                      | Yes     | `pnpm build`                                            | Passed outside sandbox | Good             | Sandbox failed due Turbopack port bind; unchanged build passed outside sandbox. |
| DB generate                | Yes     | `pnpm db:generate`                                      | Passed                 | Good             | 47 tables, no schema changes.                                                   |
| Existing DB migration      | Yes     | `pnpm db:migrate`                                       | Passed                 | Good             | Ran against current dev DB.                                                     |
| Empty DB migration         | Yes     | temp DB + `pnpm db:migrate`                             | Passed                 | Good             | Temporary `eip_audit_empty` DB migrated then dropped.                           |
| Seed idempotency           | Yes     | `pnpm db:seed` twice + DB test                          | Passed                 | Good             | No duplicate default tenant/seed log.                                           |
| DB integration tests       | Yes     | `RUN_DB_TESTS=1 pnpm test`                              | Passed                 | Strong           | 43 tests across 12 files.                                                       |
| Repository tests           | Yes     | DB integration tests                                    | Passed                 | Good             | Tenant scoping, FK, duplicates, ledger, reporting.                              |
| Auth/RBAC tests            | Yes     | `tests/integration/auth-rbac.test.ts`                   | Passed                 | Good             | Permission allow/deny, inactive users, logout, cross-tenant email.              |
| API route tests            | Partial | Manual/live curls only                                  | Partial                | Weak             | No automated route-handler/e2e API smoke suite.                                 |
| Storage tests              | Partial | `tests/integration/assets.test.ts`, `reporting.test.ts` | Passed                 | Medium           | Upload/export metadata covered; download/delete missing.                        |
| Valkey tests               | Partial | `production-hardening.test.ts`, live readiness          | Passed                 | Medium           | Rate-limit key tested; no lock/queue/idempotency helper tests.                  |
| E2E tests                  | Missing | N/A                                                     | N/A                    | Missing          | `tests/e2e/.gitkeep` only.                                                      |
| QA/UAT checklist           | Yes     | Docs                                                    | Present                | Good             | `docs/QA/UAT_SIGNOFF.md`, `docs/engineering/PRODUCT_MANAGER_UAT_CHECKLIST.md`.  |

## K. Security And License Readiness

Status: **PARTIAL**

Ready evidence:

- `pnpm check:forbidden` passed.
- Package manifests use allowed dependencies: Next/React/TypeScript, Drizzle/Postgres, Valkey GLIDE, AWS S3 client for MinIO, OpenTelemetry/Prometheus tooling.
- No Prisma, Supabase runtime, Firebase, MongoDB/Mongoose, Neon runtime, or paid SaaS core dependency was found in manifests/imports.
- `.gitignore` excludes `.env`; `git ls-files` shows `.env.example` is tracked and `.env` is ignored.
- Global security headers exist in `apps/web/next.config.mjs`.
- Passwords are scrypt-hashed in `packages/auth/src/passwords.ts`.
- Sessions store token hashes, not plaintext tokens.
- Login rate limiting exists.
- Sensitive mutations write audit logs.
- Error wrapper hides unhandled internals as generic `internal_error`.

Risks:

- `.env.example` contains real-looking local service defaults instead of explicit placeholders.
- Compose uses default MinIO and Grafana credentials for local dev.
- CSP currently allows `unsafe-inline` and `unsafe-eval`.
- No upload limits or MIME enforcement.
- No production SSO/IdP integration.
- No evidence of copied AGPL/Elastic/O'Saasy code was found inside product source; this was static inspection, not a full provenance scan.

## L. Frontend Exclusion Rule

Out of scope for this audit:

- Final dashboard visual design.
- Final page layouts.
- Final charts.
- Styling polish.
- Frontend empty/loading/error visual polish.
- Responsive UI polish.

In scope and audited:

- Backend contracts for future frontend work.
- API/service coverage required by frontend workflows.
- Validation/error shapes.
- Backend-enforced permissions.
- Route existence and build output.

Frontend development can safely start for the APIs documented in `docs/engineering/API_CONTRACT.md`, but frontend work that requires missing admin mutations, location CRUD, file download/delete, export download, or background job status must wait for backend fixes.

## M. Exact Next Actions

1. Implement storage completion:
   - Add `getObject`/presigned download helper.
   - Add authorized attachment download route.
   - Add export download route.
   - Add soft-delete/delete metadata behavior.
   - Add file size/MIME validation and tests.

2. Complete Valkey primitives:
   - Add `locks.ts`, `idempotency.ts`, and `queue.ts` or explicitly revise the architecture if queues remain out of scope.
   - Use Valkey locking/idempotency for import/export/stock long-running operations.
   - Add retry/dead-letter documentation and tests.

3. Add admin lifecycle APIs:
   - User create/update/status/password reset.
   - Role create/update/permission assignment.
   - User-role assignment create/delete with scope support.
   - Audit logs and tests.

4. Add location service and APIs:
   - CRUD/list endpoints for sites/buildings/floors/rooms/racks/shelves/bins.
   - Permission checks using `locations.manage`.
   - Tenant-scoped validation and tests.

5. Add automated API smoke tests:
   - Route-handler or HTTP tests for auth, catalog, assets, stock, custody, maintenance, reporting, health, metrics, and ops status.
   - Include unauthorized/forbidden/invalid input cases.

6. Production packaging:
   - Add production Dockerfile and production Compose/deploy template.
   - Add offline pnpm-store/image manifest generation script.
   - Replace default service credentials in production templates.
   - Rehearse restore in isolated environment and record evidence.

7. Observability hardening:
   - Add domain metrics for auth, asset mutations, stock movements, imports, exports, storage writes, and error counts.
   - Add Prometheus alert rule files.
   - Add request duration/status logging.

8. Release hygiene:
   - Commit/tag all product files.
   - Ensure `.env` is not distributed.
   - Tighten CSP after validating required Next.js/runtime behavior.

## N. Commands Run

| Command                                                 | Result                                    | Notes                                                                                                                 |
| ------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                          | Passed                                    | Lockfile already up to date.                                                                                          |
| `pnpm check:forbidden`                                  | Passed                                    | No forbidden deps/imports.                                                                                            |
| `pnpm check`                                            | Passed                                    | Typecheck, lint, format check, non-DB tests, forbidden check passed.                                                  |
| `pnpm build`                                            | Failed in sandbox, passed outside sandbox | First failure was Turbopack worker port bind `Operation not permitted`; escalated rerun passed and listed all routes. |
| `pnpm db:generate`                                      | Passed                                    | 47 tables, no schema changes.                                                                                         |
| `pnpm docker:dev`                                       | Passed                                    | Services running.                                                                                                     |
| `pnpm db:migrate`                                       | Passed                                    | Existing dev DB.                                                                                                      |
| `pnpm db:seed`                                          | Passed                                    | First run.                                                                                                            |
| `pnpm db:seed`                                          | Passed                                    | Second idempotency run.                                                                                               |
| `RUN_DB_TESTS=1 pnpm test`                              | Passed                                    | 12 files, 43 tests.                                                                                                   |
| Empty DB migration check                                | Passed                                    | Created temp DB `eip_audit_empty`, ran `pnpm db:migrate`, dropped temp DB.                                            |
| `docker compose -f infra/docker-compose.dev.yml ps`     | Passed                                    | Postgres/Valkey/MinIO/Mailpit healthy where configured; all core services running.                                    |
| Temporary `pnpm --filter @custivio/web dev --port 3012` | Not needed; existing server found         | Next reported existing dev server on `localhost:3002`, PID 96182.                                                     |
| `curl /api/health/live` on port 3002                    | Passed                                    | HTTP 200.                                                                                                             |
| `curl /api/health/ready` on port 3002                   | Passed                                    | HTTP 200; Postgres, Valkey, MinIO OK.                                                                                 |
| `curl /api/metrics` on port 3002                        | Passed                                    | HTTP 200 Prometheus text.                                                                                             |
| `curl /api/ops/status` on port 3002                     | Passed                                    | HTTP 200 ready.                                                                                                       |

## Evidence Appendix

Important files inspected:

- `AGENTS.md`
- `package.json`
- `pnpm-workspace.yaml`
- `eslint.config.mjs`
- `scripts/check-forbidden-deps.mjs`
- `.gitignore`
- `.env.example`
- `apps/web/next.config.mjs`
- `apps/web/middleware.ts`
- `apps/web/lib/api/responses.ts`
- `apps/web/lib/auth/session.ts`
- `apps/web/app/api/**/route.ts`
- `packages/config/src/index.ts`
- `packages/auth/src/passwords.ts`
- `packages/auth/src/sessions.ts`
- `packages/cache/src/valkey-client.ts`
- `packages/cache/src/rate-limit.ts`
- `packages/core/src/health.ts`
- `packages/core/src/security/rate-limit-service.ts`
- `packages/core/src/catalog/catalog-service.ts`
- `packages/core/src/assets/asset-service.ts`
- `packages/core/src/stock/stock-service.ts`
- `packages/core/src/operations/operations-service.ts`
- `packages/core/src/reporting/reporting-service.ts`
- `packages/db/drizzle.config.ts`
- `packages/db/src/client.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/seed.ts`
- `packages/db/src/schema/*.ts`
- `packages/db/src/repositories/*.ts`
- `packages/db/src/migrations/**`
- `packages/storage/src/minio-client.ts`
- `packages/storage/src/object-keys.ts`
- `packages/telemetry/src/logger.ts`
- `packages/telemetry/src/metrics.ts`
- `packages/telemetry/src/request-id.ts`
- `infra/docker-compose.dev.yml`
- `infra/minio/init-bucket.sh`
- `infra/prometheus/prometheus.yml`
- `infra/otel/collector-config.yml`
- `infra/grafana/**`
- `scripts/backup-dev.sh`
- `scripts/restore-dev.sh`
- `tests/integration/*.test.ts`
- `vitest.config.ts`
- `docs/engineering/API_CONTRACT.md`
- `docs/engineering/MASTER_PRODUCT_ROADMAP.md`
- `docs/engineering/PROJECT_PROGRESS.md`
- `docs/engineering/TESTING_GATES.md`
- `docs/engineering/features/*.md`
- `docs/operations/*.md`
