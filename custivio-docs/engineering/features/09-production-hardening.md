# Phase 9 - Production Hardening

## Requirement

Prepare the platform for on-prem and air-gapped operation with backup/restore guidance, security
headers, Valkey-backed login rate limiting, operational status, observability dashboards, release
docs, and UAT signoff.

## Scope

- Add backup and restore scripts for local/dev PostgreSQL and MinIO.
- Add air-gap deployment, security, observability, admin, user, release, and UAT documentation.
- Add global HTTP security headers.
- Add Valkey-backed login rate limiting.
- Add `/api/ops/status` and protected `/admin/status`.
- Add a Grafana production hardening dashboard.

## Out Of Scope

- Production identity-provider integration.
- Automated production backup scheduler.
- Attachment/export signed download flows.
- Background workers for imports and exports.

## Affected Folders

- `apps/web`
- `packages/cache`
- `packages/core`
- `infra/grafana`
- `scripts`
- `docs/operations`
- `docs/QA`
- `docs/engineering/features`
- `tests/integration`

## DB Changes

No database schema changes are required. Existing migrations remain unchanged.

## API/Server Actions

- `POST /api/auth/login` checks the Valkey-backed login rate limit before password authentication.
- `GET /api/ops/status` returns operational dependency status.

## UI Changes

- `/admin/status` shows dependency readiness for administrators.
- App navigation includes `Status`.
- Login page shows a business-friendly rate-limit error.

## Permission Rules

- `/admin/status` requires `tenants.manage`.
- `/api/ops/status` exposes operational readiness for probes and does not expose tenant data.

## Audit Log Rules

- No new domain mutation audit logs are introduced.
- Existing login success/failure audit logging remains in `authenticateWithPassword`.
- Rate-limited attempts are blocked before credential validation and are visible through Valkey keys
  and HTTP 429 responses.

## Tests

- Integration test validates non-PII rate-limit key generation.
- Integration test validates required security header configuration.
- Integration test validates operations docs and Grafana dashboard artifacts.
- Manual HTTP smoke validates health, metrics, ops status, and admin status.

## Product Manager UAT Checklist

- Non-technical usability: Operations page uses dependency names and status labels.
- Empty state: Not applicable; dependency list is always rendered.
- Error state: Dependency failures show `not ready` with notes.
- Success feedback: Ready dependencies show status and latency.
- Business labels: Backup, restore, release, admin, and user docs use operator-facing labels.
- End-to-end workflow: Operators can check status, back up, restore, and follow release checks.
- Inventory usefulness: Hardening protects inventory operations before on-prem release.
- UAT status: `passed_with_gaps`.

## Rollback/Migration Notes

No schema rollback is needed. To roll back the rate limiter, remove the login route call to
`checkLoginRateLimit`. To roll back headers, remove the `headers()` block in `apps/web/next.config.mjs`.

## Commands Run

- `bash -n scripts/backup-dev.sh` - passed.
- `bash -n scripts/restore-dev.sh` - passed.
- `pnpm format` - passed.
- `pnpm typecheck` - passed.
- `pnpm lint` - passed after lint fixes.
- `pnpm format:check` - passed.
- `pnpm check` - passed.
- `pnpm build` - passed outside sandbox after sandbox-only Turbopack worker port failure.
- `pnpm docker:dev` - passed outside sandbox.
- `pnpm db:migrate` - passed outside sandbox.
- `pnpm db:seed` - passed twice outside sandbox.
- `RUN_DB_TESTS=1 pnpm test` - passed outside sandbox, 43 tests passed.
- `BACKUP_DIR=/private/tmp/eip-phase9-backup-test pnpm backup:dev` - passed.
- HTTP smoke: `/api/health/live`, `/api/health/ready`, `/api/metrics`, `/api/ops/status`,
  `/admin/status`, `/dashboard`, and login rate-limit burst - passed.

## Known Gaps

- Next `middleware.ts` to `proxy.ts` migration remains future hardening work.
- Production backup scheduler and identity-provider integration remain future work.
- Destructive restore was not run against the shared local dev database; restore syntax and runbook
  were verified, and restore should be tested in an isolated environment before release.
