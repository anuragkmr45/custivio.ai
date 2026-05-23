# Phase 2: Database Foundation

## Requirement

Build the production Drizzle/PostgreSQL foundation for tenant, organization, RBAC, location, asset catalog, asset registry, attachments, lifecycle events, and audit logging.

## Scope

- Modular Drizzle schema.
- Tenant-scoped repository helpers.
- Idempotent seed for default tenant, permissions, roles, and role-permission grants.
- Integration tests for constraints, seed idempotency, tenant isolation, and audit append behavior.

## Out Of Scope

- Login/session auth.
- UI CRUD workflows.
- Asset attachment upload/download implementation.
- Stock, custody, maintenance, import/export, and reporting workflows.

## Affected Folders

- `packages/db/src/schema`
- `packages/db/src/repositories`
- `packages/db/src/seed.ts`
- `tests/integration`
- `docs/engineering`

## DB Changes

- Add organization, department, RBAC, location, asset catalog, asset, identifier, attachment, and lifecycle event tables.
- Extend `users` with optional organization and department references.
- Keep `audit_logs` append-only through repository boundaries.
- Generate a Drizzle migration.

## API/Server Actions

- None. This phase exposes package-level repository APIs only.

## UI Changes

- None.

## Permission Rules

- Roles and user-role assignments are tenant-scoped.
- Permission keys are seeded globally and granted to tenant roles through tenant-scoped role-permission rows.
- Application enforcement is implemented in Phase 3.

## Audit Log Rules

- Seed writes a `system.seed` audit record once per tenant.
- Repository exposes append-only audit log creation.
- No update/delete audit repository API is provided.

## Tests

- Seed idempotency.
- Tenant creation and lookup.
- Role and permission seed.
- Location hierarchy constraints.
- Duplicate asset tag blocked.
- Duplicate serial number blocked.
- Foreign key behavior.
- Append-only audit repository behavior.

## Product Manager UAT Checklist

- Non-technical usability: no UI in this phase.
- Empty state: no UI in this phase.
- Error state: repository errors remain technical and internal in this phase.
- Success feedback: command/test output confirms success.
- Business labels: seeded roles and permission keys use inventory/business terms.
- End-to-end workflow: sample laptop asset can be represented with tenant, site, type, model, identifiers, and lifecycle event data.
- Inventory usefulness: provides required foundation for real inventory operations.
- UAT status: `passed`.

## Rollback/Migration Notes

- Migration is additive except optional `users` references.
- No destructive table or column drops.
- Existing Phase 1 tables remain compatible.

## Commands Run

- `pnpm format`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:seed`
- `RUN_DB_TESTS=1 pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm docker:dev`
- `curl -sS -i http://127.0.0.1:3005/api/health/live`
- `curl -sS -i http://127.0.0.1:3005/api/health/ready`
- `curl -sS -i http://127.0.0.1:3005/api/metrics`

## Verification Result

- Formatting, typecheck, lint, unit tests, forbidden dependency scan, DB migration, idempotent seed, DB integration tests, build, Docker Compose startup, and health endpoints passed.
- `pnpm db:migrate`, `pnpm build`, `pnpm docker:dev`, DB tests, and localhost health checks required running outside the sandbox for local IPC, Docker socket, or localhost access.
- The first sandboxed `pnpm build` failed because Turbopack could not bind its internal worker port. The same build passed unchanged outside the sandbox.

## Known Gaps

- Full permission enforcement, sessions, and UI are Phase 3+.
