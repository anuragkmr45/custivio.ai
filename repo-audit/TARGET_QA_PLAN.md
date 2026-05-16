# Target QA Plan

## Universal Gates

- Typecheck, lint, format check, unit tests, integration tests, and E2E smoke tests.
- Dependency check: no Prisma, Supabase, Firebase, MongoDB, Neon/serverless-only runtime, or paid SaaS core dependency.
- Migration test against empty PostgreSQL.
- Seed idempotency test.
- Docker restart test.

## Security

- Invalid login, valid login, session expiry, logout invalidation, disabled user login denial.
- Role matrix: admin, asset manager, stock manager, maintenance user, auditor, read-only.
- Tenant isolation: tenant A cannot read or mutate tenant B data.
- Department/site scope tests for every protected query and mutation.
- Upload security: MIME allowlist, size limit, object-key sanitization, download permission checks.

## Domain Tests

- Asset CRUD with required and custom fields.
- Duplicate asset tag/serial rejection within tenant.
- Asset status/condition events are immutable.
- Location assignment writes movement event.
- Custody check-out/check-in/transfer approval/rejection.
- Stock receive/issue/transfer/adjust; negative balance blocked.
- Maintenance ticket lifecycle and warranty expiry report.
- Audit campaign, scan verification, missing/damaged finding, locked submission, export.
- Import preview, row errors, duplicate handling, retry, large job.
- Export generation to MinIO and permission-checked download.

## Observability Tests

- Live health works without dependencies.
- Ready health fails when DB/Valkey/MinIO is unavailable.
- Metrics endpoint emits Prometheus text.
- Request IDs appear in logs and error responses.
- Grafana and Prometheus load with expected targets.

