# Master Product Roadmap — Enterprise Inventory Platform

This file is the single source of truth for implementation phases.

## Product goal

Build an enterprise-grade, on-prem and air-gapped inventory and IT asset management platform for computers, servers, network devices, racks, cables, chips, spares, consumables, accessories, licenses, maintenance, audits, and reports.

## Phase status key

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

---

# Phase 0 — Safe cleanup and governance validation

## Goal

Clean unused files safely and verify Phase 1 scaffold is not polluted by research repos, duplicate files, or accidental artifacts.

## Tasks

- [ ] Run baseline `pnpm check`, `pnpm build`, `RUN_DB_TESTS=1 pnpm test`.
- [ ] Create cleanup report.
- [ ] Remove OS metadata and obvious junk.
- [ ] Move uncertain unused files to `_cleanup_review/phase-1/`.
- [ ] Verify no reference repos are inside the product repo.
- [ ] Verify governance docs exist.
- [ ] Verify ESLint boundaries exist.
- [ ] Verify forbidden dependency checker exists.
- [ ] Rerun all checks.
- [ ] Update `PROJECT_PROGRESS.md`.

## Testing

- Unit: existing tests pass.
- Integration: DB tests pass.
- Build: Next build passes.
- QA: health endpoints still work.
- PM/UAT: app still opens and initial shell is understandable.

---

# Phase 1 — Scaffold hardening

## Goal

Make the base scaffold stable enough for rapid feature development.

## Tasks

- [ ] Confirm workspace package names and aliases.
- [ ] Confirm TypeScript project references or workspace configs.
- [ ] Confirm ESLint boundaries work by testing a forbidden import.
- [ ] Confirm env validation blocks missing variables.
- [ ] Confirm Docker Compose starts Postgres, Valkey, MinIO, Mailpit, OTel, Prometheus, Grafana.
- [ ] Confirm `/api/health/live`, `/api/health/ready`, `/api/metrics`.
- [ ] Add `docs/engineering/PROJECT_PROGRESS.md`.
- [ ] Add phase verification script if missing.
- [ ] Add basic CI command documentation.

## Testing

- `pnpm check`
- `pnpm build`
- `pnpm db:migrate`
- `pnpm db:seed`
- `RUN_DB_TESTS=1 pnpm test`
- manual health route testing

---

# Phase 2 — Database foundation

## Goal

Create the full Drizzle/PostgreSQL foundation for tenant, organization, locations, users, RBAC, asset catalog, assets, attachments, lifecycle events, and audit logs.

## Tasks

- [ ] Create modular schema files.
- [ ] Add tenants and organizations.
- [ ] Add departments.
- [ ] Add sites/buildings/floors/rooms/racks/shelves/bins.
- [ ] Add users and user profile fields.
- [ ] Add roles, permissions, role assignments.
- [ ] Add asset categories.
- [ ] Add asset types and custom field definitions.
- [ ] Add manufacturers, models, vendors.
- [ ] Add assets table.
- [ ] Add asset identifiers table.
- [ ] Add asset attachments table.
- [ ] Add asset events/lifecycle table.
- [ ] Harden audit logs as immutable event records.
- [ ] Add indexes and tenant-scoped uniqueness.
- [ ] Add seed roles/permissions.
- [ ] Add repository tests.
- [ ] Add migration notes.

## Testing

- Migration against empty DB.
- Seed idempotency.
- Tenant uniqueness constraints.
- Foreign key constraints.
- Repository integration tests.
- No tenant-unscoped query patterns.

## PM/UAT

- Admin can understand which master data will exist.
- Data model supports hardware, cables, chips, consumables and servers.
- No technical-only names are exposed in future UI labels.

---

# Phase 3 — Auth, RBAC and tenant isolation

## Goal

Implement secure user/session handling and role-based permission checks.

## Tasks

- [ ] Define permission matrix.
- [ ] Implement session helpers.
- [ ] Implement auth guards.
- [ ] Implement role assignment service.
- [ ] Implement tenant context resolver.
- [ ] Protect route handlers/server actions.
- [ ] Add audit logs for auth/security actions.
- [ ] Add admin user management foundation.
- [ ] Add tests for permission checks.
- [ ] Add tests for cross-tenant denial.

## Testing

- Unit: permission helpers.
- Integration: user role assignments.
- Security: cross-tenant access blocked.
- QA: unauthorized UI access blocked.
- PM/UAT: admin can understand users/roles.

---

# Phase 4 — Asset catalog and templates

## Goal

Allow admins to configure asset categories, asset types, custom fields, manufacturers, models and vendors.

## Tasks

- [ ] Asset category CRUD.
- [ ] Asset type CRUD.
- [ ] Custom field definitions.
- [ ] Validation rules for custom fields.
- [ ] Manufacturer CRUD.
- [ ] Model CRUD linked to manufacturer/type.
- [ ] Vendor CRUD.
- [ ] Audit logs for catalog changes.
- [ ] UI screens for catalog setup.
- [ ] Tests and UAT checklist.

## Testing

- Required field validation.
- Duplicate category/type prevention.
- Custom field validation.
- Permission checks.
- Audit logs.

## PM/UAT

- Admin can create "Laptop", "Server", "Cable", "Chip", "Network Switch".
- Admin can add fields like RAM, CPU, Port Count, Cable Length, Chip Package.

---

# Phase 5 — Asset registry

## Goal

Create, search, view and manage serialized assets.

## Tasks

- [ ] Asset create/edit/view.
- [ ] Asset list with filters.
- [ ] Asset detail page.
- [ ] Asset tag/serial validation.
- [ ] Asset status and condition workflow.
- [ ] Attachments through MinIO.
- [ ] QR/barcode value generation.
- [ ] Asset lifecycle history.
- [ ] Audit logging.
- [ ] Unit/integration/UI tests.

## Testing

- Duplicate serial rejected.
- Duplicate asset tag rejected.
- Attachment upload/download permissions.
- Search/filter performance.
- Audit history generated.

## PM/UAT

- IT user can add a laptop/server/network device.
- User can quickly search by serial, tag, location, status.
- Asset detail page is readable and useful.

---

# Phase 6 — Locations, custody and movement

## Goal

Track where every asset is and who is responsible.

## Tasks

- [ ] Location tree UI.
- [ ] Assign asset to location.
- [ ] Assign asset to custodian.
- [ ] Check-out/check-in workflow.
- [ ] Transfer request workflow.
- [ ] Approval/rejection workflow.
- [ ] Movement history.
- [ ] Handover document/export foundation.
- [ ] Tests and UAT.

## Testing

- Movement event immutability.
- Current state consistency.
- Unauthorized movement blocked.
- Transfer approval updates location/custodian.
- Rejection keeps old state.

## PM/UAT

- Store/IT team can see who has what.
- Manager can approve movement.
- History is clear enough for audit.

---

# Phase 7 — Stock, consumables, cables and components

## Goal

Support non-serialized inventory with quantity and ledger-based stock movement.

## Tasks

- [ ] Stock item master.
- [ ] Unit of measure.
- [ ] Bin/shelf storage.
- [ ] Receive stock.
- [ ] Issue stock.
- [ ] Transfer stock.
- [ ] Adjust stock with reason.
- [ ] Minimum stock alerts.
- [ ] Cable/component/chip attributes.
- [ ] Stock ledger reports.
- [ ] Tests and UAT.

## Testing

- Ledger balance correct.
- Negative stock blocked.
- Adjustment requires reason.
- Transfer updates source/target.
- Low stock alert works.

## PM/UAT

- Store user can manage CAT6 cable, RAM sticks, chips, adapters, spare parts.
- Stock history is clear and trustworthy.

---

# Phase 8 — Maintenance and warranty

## Goal

Track repair, preventive maintenance, warranty and downtime.

## Tasks

- [ ] Maintenance ticket lifecycle.
- [ ] Preventive maintenance schedule.
- [ ] Vendor repair tracking.
- [ ] Warranty fields/report.
- [ ] Downtime tracking.
- [ ] Maintenance attachments.
- [ ] Dashboard widgets.
- [ ] Tests and UAT.

## Testing

- Ticket lifecycle.
- Warranty expiry report.
- Preventive schedule generation.
- Attachment evidence.
- Audit logs.

## PM/UAT

- IT team can see which assets need repair.
- Manager can see warranty expiry and downtime.

---

# Phase 9 — Physical audit and verification

## Goal

Enable audit campaigns, physical verification, missing/damaged findings, and evidence.

## Tasks

- [ ] Audit campaign create/edit.
- [ ] Scope audit by site/location/type/department.
- [ ] Audit checklist UI.
- [ ] Mark verified/missing/damaged.
- [ ] Upload evidence to MinIO.
- [ ] Submit/lock audit.
- [ ] Reopen workflow with permission.
- [ ] Audit summary report/export.
- [ ] Tests and UAT.

## Testing

- Submitted audit locked.
- Evidence upload permissions.
- Missing/damaged summary.
- Cross-tenant blocked.
- Audit report export.

## PM/UAT

- Auditor can complete audit without technical help.
- Manager can understand audit result.

---

# Phase 10 — Imports, exports and reporting

## Goal

Support bulk onboarding, exports and business reports.

## Tasks

- [ ] CSV/XLSX templates.
- [ ] Import validation preview.
- [ ] Background import job.
- [ ] Failed row report.
- [ ] Export jobs to MinIO.
- [ ] Saved filters.
- [ ] Dashboard reports.
- [ ] Role-aware reporting.
- [ ] Tests and UAT.

## Testing

- Valid import.
- Invalid import.
- Duplicate rows.
- Large import.
- Export generation.
- Permission-filtered report.

## PM/UAT

- Admin can bulk upload initial inventory.
- Error report is understandable.
- Reports answer real management questions.

---

# Phase 11 — Valkey jobs, notifications and reliability

## Goal

Use Valkey for rate limits, idempotency, locks and async workflow support.

## Tasks

- [ ] Rate-limit protected endpoints.
- [ ] Idempotency keys for imports/exports/stock actions.
- [ ] Distributed lock helper.
- [ ] Background job primitives.
- [ ] Notification/event table.
- [ ] Alert workflow for warranty/low-stock/audit.
- [ ] Tests and UAT.

## Testing

- Repeated request idempotency.
- Lock prevents duplicate processing.
- Rate limit works.
- Alerts generated correctly.

## PM/UAT

- User sees clear alerts.
- Repeated clicks do not duplicate stock movement.

---

# Phase 12 — Observability and admin operations

## Goal

Make the product production-operable on-prem.

## Tasks

- [ ] Structured logging with request IDs.
- [ ] Metrics for API/db/storage/cache.
- [ ] Tracing for important flows.
- [ ] Grafana dashboard.
- [ ] Backup/restore docs.
- [ ] Health readiness hardening.
- [ ] Admin operation guide.
- [ ] Tests and QA drills.

## Testing

- Prometheus metrics visible.
- Grafana loads dashboard.
- Trace/log request correlation.
- Backup/restore drill.
- Dependency-down readiness test.

## PM/UAT

- Admin can understand system health.
- Deployment team has clear runbook.

---

# Phase 13 — UX polish and product completeness

## Goal

Make the system pleasant, clear and production-worthy for real users.

## Tasks

- [ ] Dashboard polish.
- [ ] Empty states.
- [ ] Error states.
- [ ] Loading states.
- [ ] Confirmation dialogs.
- [ ] Breadcrumbs.
- [ ] Table filters/sorting.
- [ ] Responsive layouts.
- [ ] Accessibility pass.
- [ ] Business-friendly copy.

## Testing

- UI smoke tests.
- Keyboard navigation.
- Empty/error/loading state review.
- PM walkthrough.

## PM/UAT

- Non-technical user can navigate.
- Screens look professional and clean.
- Workflows are obvious.

---

# Phase 14 — Security, performance and scale hardening

## Goal

Prepare for enterprise-scale use.

## Tasks

- [ ] Security headers.
- [ ] CSRF/session hardening.
- [ ] Input size limits.
- [ ] File upload limits.
- [ ] Query index review.
- [ ] Pagination everywhere.
- [ ] Load smoke tests.
- [ ] Permission bypass tests.
- [ ] Audit log immutability review.
- [ ] Dependency/license review.

## Testing

- Security test suite.
- Performance smoke tests.
- Large data list tests.
- File upload limits.
- Permission matrix.

## PM/UAT

- System remains usable with large inventory.
- Sensitive operations feel controlled.

---

# Phase 15 — Release packaging and documentation

## Goal

Prepare product for QA handover, product testing and deployment.

## Tasks

- [ ] Admin guide.
- [ ] User guide.
- [ ] Deployment guide.
- [ ] Backup/restore guide.
- [ ] Release notes.
- [ ] Known issues list.
- [ ] Final QA checklist.
- [ ] Final PM/UAT signoff checklist.
- [ ] Air-gap packaging notes.
- [ ] Rollback procedure.

## Testing

- Clean install test.
- Upgrade migration test.
- Backup restore test.
- End-to-end business scenarios.
- Final release build.

## PM/UAT

- Product can be demonstrated end-to-end.
- QA can test without developer explanation.
- Deployment team can install from docs.
