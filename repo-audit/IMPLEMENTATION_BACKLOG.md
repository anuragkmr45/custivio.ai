# Implementation Backlog

## Phase 0: Audit And Target Design

- Goal: Complete this `repo-audit/` folder and lock target architecture.
- Scope: Repo summaries, scorecard, reusable ideas, do-not-use list, target design, QA plan, backlog.
- Files/folders to create: `repo-audit/**`.
- DB tables/migrations: none.
- API/server actions: none.
- UI screens: none.
- Tests: evidence spot checks.
- Acceptance criteria: all requested audit files exist; every material claim cites a path; rejected dependencies are explicit.
- Out-of-scope: implementing `enterprise-inventory-platform`.
- Risks: missing repo facts; mitigated by marking unclear/missing evidence.
- Manual QA checklist: verify file count, skim scorecard, confirm strict rejects.
- Product testing checklist: validate ranking and backlog align with target requirements.

## Phase 1: Fresh Project Scaffold

- Goal: Create monorepo with Next.js, TypeScript, Drizzle, PostgreSQL, Valkey, MinIO, Docker Compose, health routes.
- Scope: workspace config, `apps/web`, shared packages, `.env.example`, Docker services, baseline README/ADR.
- Files/folders to create: `enterprise-inventory-platform/apps/web`, `packages/{db,core,auth,storage,cache,config,telemetry}`, `infra/**`, `docs/**`, `tests/**`.
- DB tables/migrations: `tenants`, `users`, `audit_logs`.
- API/server actions: `/api/health/live`, `/api/health/ready`, `/api/metrics`.
- UI screens: basic authenticated-style dashboard shell placeholder.
- Tests: env validation, health route unit/integration checks, DB/Valkey/MinIO connectivity checks.
- Acceptance criteria: install, Docker Compose, app startup, health readiness, typecheck, lint, tests pass.
- Out-of-scope: full auth, RBAC, asset workflows.
- Risks: dependency drift; pin versions and document all services.
- Manual QA checklist: start Compose, visit app, hit health endpoints, inspect MinIO bucket.
- Product testing checklist: clean clone setup works from README.

## Phase 2: Database Foundation

- Goal: Build production Drizzle schema foundations.
- Scope: tenant/org/location/access-control base plus asset/audit seed foundations.
- Files/folders to create: schema modules, migrations, seed scripts, repository helpers.
- DB tables/migrations: tenants, organizations, departments, users, roles, permissions, role assignments, sites/buildings/floors/rooms/racks, asset categories/types, manufacturers/models/vendors, assets, identifiers, attachments, events, audit logs.
- API/server actions: internal repository/service calls only.
- UI screens: none beyond basic admin seed visibility if already available.
- Tests: migration up/down, seed idempotency, FK/unique constraints, tenant isolation repository tests.
- Acceptance criteria: empty DB migrates and seeds admin tenant/user/roles.
- Out-of-scope: UI CRUD.
- Risks: overfitting custom fields early; keep field schema minimal but typed.
- Manual QA checklist: run migrations twice, run seed twice, inspect tables.
- Product testing checklist: sample laptop asset can be represented in schema.

## Phase 3: Auth, RBAC, Tenant Isolation

- Goal: Secure session auth, users, roles, and permission checks.
- Scope: login/logout, password policy, route guards, scoped permissions, audit security events.
- Files/folders to create: auth services, permission matrix, middleware, admin user UI.
- DB tables/migrations: sessions if not present, password reset tokens, user groups/group members if deferred.
- API/server actions: login, logout, current user, user create/update/disable, role assignment.
- UI screens: login, users, roles/permissions, access denied.
- Tests: role matrix, cross-tenant access, disabled user login, session expiry, audit log creation.
- Acceptance criteria: every protected mutation checks tenant and permission.
- Out-of-scope: SSO/SCIM.
- Risks: permission bypass; require shared guard helper and negative tests.
- Manual QA checklist: attempt forbidden routes/actions as lower role.
- Product testing checklist: admin can create operator and auditor users.

## Phase 4: Asset Catalog And Templates

- Goal: Configure asset categories, types, custom fields, manufacturers, models, vendors.
- Scope: admin CRUD and validation for configurable asset templates.
- Files/folders to create: catalog services, server actions/routes, UI modules.
- DB tables/migrations: asset type field validation additions if needed.
- API/server actions: category/type/field/manufacturer/model/vendor CRUD.
- UI screens: catalog admin, type editor, field builder.
- Tests: duplicate keys, required fields, option validation, audit logs.
- Acceptance criteria: admins can create Laptop type with CPU/RAM/storage/OS fields.
- Out-of-scope: asset registry bulk import.
- Risks: custom field complexity; restrict v1 field types to text, number, date, boolean, select.
- Manual QA checklist: create/edit/delete blocked when in use.
- Product testing checklist: laptop/server/cable types can be modeled.

## Phase 5: Asset Registry

- Goal: Core fixed-asset CRUD with attachments and QR/barcode payloads.
- Scope: create/edit/view/search assets, status/condition, assignment pointers, attachments.
- Files/folders to create: asset services, attachment service, asset UI screens.
- DB tables/migrations: asset events/attachments refinements.
- API/server actions: asset CRUD, attachment upload/download/delete, QR payload generation.
- UI screens: asset list, asset detail, asset form, attachment panel, QR preview.
- Tests: duplicate serial/tag, custom field validation, MinIO object key, event history.
- Acceptance criteria: asset history preserved and attachments stored in MinIO.
- Out-of-scope: custody approval workflow.
- Risks: attachment authorization; permission-check every object access.
- Manual QA checklist: upload/download/delete attachment as allowed and denied users.
- Product testing checklist: new laptop procurement scenario through asset creation.

## Phase 6: Stock And Consumables

- Goal: Consumable/spare/cable stock management.
- Scope: items, units, locations, receive, issue, transfer, adjust, low-stock alerts.
- Files/folders to create: inventory services, ledger repository, stock UI.
- DB tables/migrations: stock items, balances, ledger, adjustments, transfers, low-stock rules.
- API/server actions: receive/issue/transfer/adjust, balance query.
- UI screens: stock items, stock ledger, adjustment form, low-stock report.
- Tests: negative balance blocked, ledger immutable, transaction consistency.
- Acceptance criteria: stock balances match ledger after operations.
- Out-of-scope: purchasing/accounting integration.
- Risks: race conditions; use DB transactions and row locks where needed.
- Manual QA checklist: concurrent issue attempts cannot oversell.
- Product testing checklist: CAT6 cable receive/issue scenario.

## Phase 7: Custody, Movement, Maintenance

- Goal: Operational lifecycle after assets are registered.
- Scope: check-out/check-in, transfers, handover docs, maintenance tickets, warranty, schedules.
- Files/folders to create: custody and maintenance services/UI.
- DB tables/migrations: custody assignments, transfer requests, handover docs, maintenance tickets/events, warranty/repair/downtime.
- API/server actions: custody transfer, approval/reject, ticket create/assign/close, schedule update.
- UI screens: custody queue, assigned assets, maintenance board, warranty view.
- Tests: transfer approval/rejection, movement immutable, maintenance close validation.
- Acceptance criteria: custody and maintenance write asset events and audit logs.
- Out-of-scope: advanced procurement/vendor portals.
- Risks: workflow state bugs; model states explicitly and test transitions.
- Manual QA checklist: transfer asset between users and reject a transfer.
- Product testing checklist: server rack maintenance scenario.

## Phase 8: Audit, Import/Export, Reporting

- Goal: Enterprise audit campaigns and bulk data workflows.
- Scope: audit campaigns, scanning, findings, imports, exports, reports, saved views.
- Files/folders to create: audit/import/export/report services, job workers, UI.
- DB tables/migrations: audit campaign tables, import/export/report jobs, saved views.
- API/server actions: campaign create, scan verify, submit, import preview/process, export request/download.
- UI screens: audit campaign list/detail/scan, import wizard, export jobs, reports.
- Tests: invalid rows, idempotent retry, locked submissions, report file permissions.
- Acceptance criteria: audit results lock after submit; export stored in MinIO.
- Out-of-scope: mobile native app.
- Risks: large imports; use background jobs and row-level diagnostics.
- Manual QA checklist: import valid/invalid CSV and retry failed rows.
- Product testing checklist: physical audit scenario with missing/damaged assets.

## Phase 9: Production Hardening

- Goal: Air-gap readiness, observability, backups, release discipline.
- Scope: image/package docs, dashboards, backup/restore, security headers, rate limits, final E2E/UAT.
- Files/folders to create: deployment docs, Grafana dashboards, backup scripts, runbooks.
- DB tables/migrations: none unless needed for operational settings.
- API/server actions: operational status endpoints as needed.
- UI screens: system status/admin ops.
- Tests: backup/restore, upgrade migration, Docker restart, dependency policy.
- Acceptance criteria: clean install and offline image flow documented and verified.
- Out-of-scope: cloud deployment automation.
- Risks: operational gaps; run release checklist before acceptance.
- Manual QA checklist: restore backup into clean environment.
- Product testing checklist: all UAT scenarios pass.

## Exact Next Prompt For Phase 1

```text
Implement Phase 1 from repo-audit/IMPLEMENTATION_BACKLOG.md. Create the fresh enterprise-inventory-platform monorepo scaffold using Next.js App Router, TypeScript, Drizzle, PostgreSQL, Valkey, MinIO, Docker Compose, OpenTelemetry, Prometheus, and Grafana. Do not copy source code from audited repos. Do not add Prisma, Supabase, Firebase, MongoDB, Neon/serverless-only runtime, or paid SaaS dependencies. Verify install/build/typecheck/lint/tests where feasible and report files created, commands to run, verification results, known gaps, and the next prompt for Phase 2.
```

