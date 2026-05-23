# Phase 8: Audit, Import/Export, And Reporting

## Requirement

Implement audit campaigns, scan results, bulk import preview/process jobs, MinIO-backed export jobs, saved filters, and reporting UI with tenant isolation, permission checks, audit logs, and idempotency/locked-submission tests.

## Scope

- Drizzle schema for audit campaigns, scan results, findings, import jobs, import rows, export jobs, and saved filters.
- Repository functions for campaign creation, scan recording, import preview/process locking, export creation, and saved filters.
- Core reporting services with validation, permission checks, idempotency keys, MinIO object writes, and audit logs.
- Route handlers and server actions for audit, import, export, and saved filter workflows.
- Combined audit/reporting UI.
- Integration tests for campaign scans, import diagnostics, locked processing, idempotent import/export submissions, and saved filters.

## Out Of Scope

- Full CSV/XLSX parsing.
- Background queues and worker retry orchestration.
- Complex dashboard charts.
- Download authorization routes for export objects.

## Affected Folders

- `packages/db/src/schema`
- `packages/db/src/repositories`
- `packages/db/src/seed.ts`
- `packages/core/src/reporting`
- `packages/storage/src/object-keys.ts`
- `apps/web/app/api/audits`
- `apps/web/app/api/imports`
- `apps/web/app/api/reports`
- `apps/web/app/(app)/audit-reports`
- `tests/integration`
- `docs/engineering`

## DB Changes

- Add `audit_campaigns`.
- Add `audit_scan_results`.
- Add `audit_findings`.
- Add `import_jobs`.
- Add `import_job_rows`.
- Add `export_jobs`.
- Add `saved_filters`.
- Add import/export/report permission seed entries.

## API/Server Actions

- `GET /api/audits/campaigns`
- `POST /api/audits/campaigns`
- `POST /api/audits/scans`
- `GET /api/imports/jobs`
- `POST /api/imports/jobs`
- `POST /api/imports/jobs/[id]/process`
- `GET /api/reports/exports`
- `POST /api/reports/exports`
- `GET /api/reports/filters`
- `POST /api/reports/filters`

## UI Screens

- `/audit-reports`

## Permission Rules

- Audit reads require `audits.read`.
- Audit mutations require `audits.write`.
- Import reads require `imports.read`.
- Import mutations require `imports.write`.
- Report/export reads require `reports.read`.
- Report/export mutations require `reports.write`.
- All reads and writes are scoped to the authenticated tenant.

## Audit Log Rules

- Campaign creation, scan recording, import preview, import processing, export creation, and saved filter creation write audit logs.

## Tests

- Audit campaign scan recording can create findings.
- Import preview records row diagnostics.
- Import processing is locked after completion and cannot be submitted twice.
- Import idempotency key returns the existing job.
- Export idempotency key returns the existing completed MinIO-backed job.
- Saved filters are tenant-scoped and listed in the overview.

## Product Manager UAT Checklist

- Non-technical usability: audit, import, export, and saved view labels match operations language.
- Empty state: tables show clear no-record rows.
- Error state: invalid rows and locked import submissions return typed errors.
- Success feedback: overview tables reflect completed campaign, import, export, and saved filter actions.
- Business labels: campaign, scan code, finding severity, import status, export file, and saved view are visible.
- End-to-end workflow: authorized user can create a campaign, record a scan, preview/process an import, create an export, and save a filter.
- Inventory usefulness: supports audit evidence, bulk workflows, and reporting.
- UAT status: `passed`.

## Rollback/Migration Notes

- Migration is additive.
- Generated export objects remain in MinIO; rollback should preserve files until an operator approves deletion.

## Commands Run

- `pnpm typecheck` - passed.
- `pnpm lint` - passed after array type fix.
- `pnpm format` - passed.
- `pnpm db:generate` - passed and created `packages/db/src/migrations/0005_nervous_lord_tyger.sql`.
- `pnpm db:migrate` - passed.
- `pnpm db:seed` - passed twice.
- `RUN_DB_TESTS=1 pnpm test` - passed, 39 tests across 11 files.
- `pnpm check` - passed.
- `pnpm build` - passed outside sandbox after sandbox-only Turbopack worker port failure.
- HTTP smoke on `127.0.0.1:3011` - login, campaign create, scan record with finding, import preview, import process, locked import rejection, export create, saved filter create, `/audit-reports`, live health, readiness, and metrics all returned expected 200/201/409 statuses.

## Verification Result

- Manual QA result: passed.
- PM/UAT result: passed.
- The audit/reporting page gives an operator clear controls for campaigns, scans, import preview/process, export creation, and saved filters.
- Import row diagnostics, idempotent submissions, locked processing, and MinIO export storage were verified by DB-backed tests.

## Known Gaps

- Background worker retries, full CSV/XLSX parsing, and download authorization routes are later work.
