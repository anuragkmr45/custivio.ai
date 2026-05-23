# Master Product Roadmap

Status values: `complete`, `in_progress`, `pending`, `blocked`.

## Phase 1: Governance And Scaffold

Status: `complete`

Goal: Create the governed monorepo foundation with Next.js, TypeScript, Drizzle, PostgreSQL, Valkey, MinIO, Docker Compose, and health checks.

Tasks:

- [x] Workspace and package scaffold.
- [x] Governance docs and boundary rules.
- [x] Health endpoints for liveness, readiness, and metrics.
- [x] Initial Drizzle schema, migration, and seed.
- [x] Docker Compose local dependencies.
- [x] Baseline tests and cleanup report.

## Phase 2: Database Foundation

Status: `complete`

Goal: Build the production database foundation and repositories.

Tasks:

- [x] Modularize Drizzle schema.
- [x] Add tenant, organization, department, user, RBAC, location, asset catalog, asset registry, attachment, lifecycle event, and audit schema modules.
- [x] Add tenant-scoped repositories.
- [x] Seed roles and permissions idempotently.
- [x] Add DB integration tests for tenant isolation, RBAC seed, hierarchy constraints, duplicate identifiers, FK behavior, and append-only audit writes.
- [x] Update Phase 2 feature note and progress.

## Phase 3: Auth, RBAC, And Tenant Isolation

Status: `complete`

Goal: Implement secure app authentication, tenant context, and permission checks.

Tasks:

- [x] Session and password tables/services.
- [x] Login/logout/current-user route handlers.
- [x] Permission matrix and scoped guard helpers.
- [x] Middleware and protected app shell.
- [x] User, role, and assignment admin screens.
- [x] Security audit events and negative authorization tests.

## Phase 4: Asset Catalog

Status: `complete`

Goal: Implement configurable catalog management.

Tasks:

- [x] CRUD for asset categories, types, custom fields, manufacturers, models, and vendors.
- [x] Validation for field definitions and option sets.
- [x] Catalog admin UI.
- [x] Audit logs and tests for duplicate keys and in-use deletes.

## Phase 5: Asset Registry

Status: `complete`

Goal: Implement fixed asset registration, search, detail, attachments, and QR/barcode payloads.

Tasks:

- [x] Asset CRUD services and route handlers.
- [x] Asset list/detail/form UI.
- [x] Attachment upload through MinIO.
- [x] Lifecycle event timeline.
- [x] Duplicate tag/serial tests and attachment authorization tests.

## Phase 6: Stock And Consumables

Status: `complete`

Goal: Implement consumable, spare, and cable stock management.

Tasks:

- [x] Stock item, unit, bin, balance, ledger, adjustment, transfer, and low-stock schema.
- [x] Receive, issue, transfer, and adjust workflows.
- [x] Stock UI and low-stock report.
- [x] Ledger immutability and transaction consistency tests.

## Phase 7: Custody, Movement, And Maintenance

Status: `complete`

Goal: Implement operational asset custody, movement, handover, warranty, and maintenance workflows.

Tasks:

- [x] Check-out/check-in and handover workflows.
- [x] Transfer requests and approval/rejection.
- [x] Maintenance ticket, warranty, repair, and downtime workflows.
- [x] Custody and maintenance UI.
- [x] State transition tests and audit logs.

## Phase 8: Audit, Import/Export, And Reporting

Status: `complete`

Goal: Implement audit campaigns, bulk data workflows, exports, reports, and saved views.

Tasks:

- [x] Audit campaign and scan result workflows.
- [x] Import preview/process jobs with row diagnostics.
- [x] Export/report jobs stored in MinIO.
- [x] Saved filters and report UI.
- [x] Retry/idempotency and locked-submission tests.

## Phase 9: Production Hardening

Status: `complete`

Goal: Prepare for on-prem and air-gapped production operation.

Tasks:

- [x] Backup and restore scripts/runbooks.
- [x] Air-gap image/package documentation.
- [x] Security headers, rate limits, and operational status.
- [x] Grafana dashboards and alert docs.
- [x] Admin guide, user guide, release checklist, and UAT signoff.
