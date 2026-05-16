# Phase-Wise Implementation Plan Template

Use this file after Codex completes the repo audit.

Every phase must be implemented in a separate Codex run. Do not ask Codex to build everything at once.

---

## Phase 0 — Repository audit and target architecture

### Goal

Understand reference repos, identify reusable ideas, reject incompatible patterns, and finalize target architecture.

### Done when

- `repo-audit/` folder exists.
- All shortlisted repos are scored.
- Target architecture is documented.
- Target data model is documented.
- Final implementation backlog is written.
- All Prisma/Supabase/Neon/AGPL risks are clearly marked.

### QA

- Verify every claim has file-path evidence.
- Verify no final architecture depends on Prisma.
- Verify no final architecture depends on cloud-only service.

---

## Phase 1 — Fresh project scaffold

### Goal

Create clean monorepo with Next.js, TypeScript, Drizzle, PostgreSQL, Valkey, MinIO and Docker Compose.

### Scope

- Create fresh repo structure.
- Add workspace package manager.
- Add lint, format, typecheck and test scripts.
- Add Docker Compose for local services.
- Add `.env.example`.
- Add health endpoints.

### Required services

- PostgreSQL
- Valkey
- MinIO
- MinIO bucket initializer
- Mailpit
- Prometheus
- Grafana
- OpenTelemetry Collector

### Done when

- `pnpm install` or selected package manager install works.
- `docker compose up` starts all dependencies.
- App starts locally.
- Health endpoint returns OK.
- DB connection works.
- Valkey ping works.
- MinIO bucket exists.
- Typecheck passes.
- Lint passes.

### QA

- Fresh clone test.
- Docker restart test.
- Env missing-variable test.
- DB migration dry-run test.

---

## Phase 2 — Database foundation with Drizzle

### Goal

Create production-grade Drizzle schema and migrations.

### Core tables

- tenants
- organizations
- departments
- users
- roles
- permissions
- role_assignments
- sites
- buildings
- floors
- rooms
- racks
- asset_categories
- asset_types
- asset_type_fields
- manufacturers
- models
- vendors
- assets
- asset_identifiers
- asset_attachments
- asset_events
- audit_logs

### Done when

- Initial migration is generated.
- Migration applies to empty PostgreSQL.
- Seed creates admin tenant/user/roles.
- DB constraints exist for tenant isolation.
- Uniqueness exists for serial number/asset tag inside tenant.
- Indexes exist for search/filter fields.

### QA

- Migration up/down test.
- Seed idempotency test.
- Unique constraint test.
- Foreign key test.
- Tenant isolation test.

---

## Phase 3 — Authentication, RBAC and tenant isolation

### Goal

Implement secure auth and permission system.

### Scope

- Login/logout
- Session management
- Admin/user roles
- Site/department-scoped permissions
- Permission helper functions
- Route guards
- Audit logs for security events

### Done when

- Admin can create users.
- Admin can assign roles.
- Unauthorized users cannot access restricted screens/API.
- Every mutation checks tenant and permission.
- Security audit events are written.

### QA

- Role matrix test.
- Cross-tenant access test.
- Session expiry test.
- Permission bypass test.

---

## Phase 4 — Asset catalog and templates

### Goal

Allow admins to configure asset types and custom fields.

### Scope

- Asset categories
- Asset types
- Type-specific fields
- Validation rules
- Manufacturers/models/vendors
- Importable templates

### Done when

- Admin can create asset category/type.
- Admin can add custom fields.
- Field validation works.
- Asset forms render dynamically based on type.
- Audit logs are written for configuration changes.

### QA

- Custom field type test.
- Required field validation test.
- Duplicate field key test.
- UI form rendering test.

---

## Phase 5 — Asset registry

### Goal

Build core asset-management workflow.

### Scope

- Create/edit/view assets
- Search/filter assets
- Serial number and asset tag uniqueness
- Status and condition management
- Assignment to user/department/location
- Attachments via MinIO
- QR/barcode value generation

### Done when

- Asset CRUD works.
- Attachments upload to MinIO.
- Asset metadata stores only object references in PostgreSQL.
- QR/barcode printable data exists.
- Full asset history is preserved.

### QA

- Create asset test.
- Duplicate serial test.
- Attachment upload/delete test.
- Search/filter test.
- Audit history test.

---

## Phase 6 — Locations and custody movement

### Goal

Track where every asset is and who is responsible.

### Scope

- Location tree
- Custodian assignment
- Check-in/check-out
- Transfer request
- Approval workflow
- Movement history

### Done when

- Asset can be moved between locations.
- Asset can be assigned to custodian.
- Transfer request can be approved/rejected.
- Movement event is immutable.
- Current asset state matches latest movement.

### QA

- Movement workflow test.
- Unauthorized transfer test.
- History immutability test.
- Current location consistency test.

---

## Phase 7 — Stock, consumables, cables and components

### Goal

Support inventory items that may exist in quantities instead of unique serialized assets.

### Scope

- Stock item master
- Units of measure
- Bins/shelves
- Stock ledger
- Receive/issue/adjust/transfer
- Minimum stock alert
- Cable/component/chip attributes

### Done when

- Serialized and non-serialized assets are clearly separated.
- Stock movements are ledger-based.
- Stock balance is derived or safely maintained.
- Negative stock is prevented unless explicitly allowed.
- Low-stock dashboard works.

### QA

- Stock receive test.
- Stock issue test.
- Transfer test.
- Adjustment test.
- Low-stock alert test.
- Ledger balance test.

---

## Phase 8 — Maintenance and service tickets

### Goal

Manage repair, preventive maintenance and warranty workflows.

### Scope

- Maintenance tickets
- Preventive schedules
- Vendor repair flow
- Warranty expiry
- Downtime
- Attachments/evidence

### Done when

- Ticket can be opened against asset.
- Ticket can be assigned and closed.
- Maintenance history is visible on asset.
- Warranty expiry report works.
- Preventive maintenance reminders are generated.

### QA

- Ticket lifecycle test.
- Warranty report test.
- Preventive schedule test.
- Attachment evidence test.

---

## Phase 9 — Audit and verification

### Goal

Enable physical verification and compliance audits.

### Scope

- Audit campaign
- Scope by location/type/department
- Asset verification
- Missing/damaged findings
- Evidence attachments
- Audit report export

### Done when

- Admin can create audit campaign.
- Auditor can mark asset verified/missing/damaged.
- Results are locked after submission.
- Audit summary report is generated.

### QA

- Audit campaign test.
- Scan/verify test.
- Missing asset test.
- Post-submit immutability test.
- Export test.

---

## Phase 10 — Imports, exports and reports

### Goal

Support bulk onboarding and enterprise reporting.

### Scope

- CSV/XLSX import templates
- Import validation preview
- Background import jobs
- Export jobs
- Dashboard charts
- Saved filters

### Done when

- User can download import template.
- User can upload CSV/XLSX.
- System validates before writing.
- Failed rows are reported clearly.
- Exports are stored in MinIO.
- Reports are role-aware.

### QA

- Valid import test.
- Invalid import test.
- Duplicate row test.
- Large import test.
- Export file test.
- Permission-filtered report test.

---

## Phase 11 — Observability and hardening

### Goal

Make system production-operable.

### Scope

- OpenTelemetry tracing
- Prometheus metrics
- Grafana dashboards
- Structured logs
- Rate limiting
- Valkey locks
- Security headers
- Backup/restore docs
- Air-gap deployment docs

### Done when

- Metrics endpoint works.
- Grafana dashboard imports.
- Traces are emitted.
- Logs are structured.
- Rate limits work.
- Backup and restore documented.
- Air-gap install documented.

### QA

- Load smoke test.
- Observability test.
- Backup/restore drill.
- Rate-limit test.
- Docker offline-start test.

---

## Phase 12 — Final QA, UAT and release packaging

### Goal

Prepare for client/internal testing and production release.

### Scope

- E2E test coverage
- Product test scenarios
- Security review
- Performance baseline
- Documentation
- Release notes
- Deployment package

### Done when

- All critical E2E tests pass.
- UAT checklist passes.
- Known issues are documented.
- Release artifact is created.
- Rollback steps are documented.

### QA

- Clean install test.
- Upgrade migration test.
- User acceptance test.
- Data import test.
- Backup restore test.
- Permission test.
- Multi-tenant isolation test.
