# Codex Prompt — Phase 2 Database Foundation

Use this only after Phase 0 cleanup and Phase 1 scaffold hardening are complete.

## Goal

Implement Phase 2 from `docs/engineering/MASTER_PRODUCT_ROADMAP.md`.

Create the full database foundation with Drizzle and PostgreSQL.

## Required reading

Read:

```text
AGENTS.md
docs/engineering/MASTER_PRODUCT_ROADMAP.md
docs/engineering/DB_DRIZZLE_RULES.md
docs/engineering/BACKEND_API_RULES.md
docs/engineering/TESTING_GATES.md
docs/engineering/PROJECT_PROGRESS.md
```

## Scope

Create modular schema and repositories for:

- tenants
- organizations
- departments
- users
- roles
- permissions
- role assignments
- sites
- buildings
- floors
- rooms
- racks
- shelves/bins
- asset categories
- asset types
- custom field definitions
- manufacturers
- models
- vendors
- assets
- asset identifiers
- asset attachments
- asset lifecycle events
- immutable audit logs

## Required structure

```text
packages/db/src/schema/
  index.ts
  common.ts
  tenants.ts
  organizations.ts
  users.ts
  rbac.ts
  locations.ts
  asset-catalog.ts
  assets.ts
  audit.ts

packages/db/src/repositories/
  tenants.repository.ts
  organizations.repository.ts
  users.repository.ts
  rbac.repository.ts
  locations.repository.ts
  asset-catalog.repository.ts
  assets.repository.ts
  audit.repository.ts
```

## Rules

- Every tenant-owned table must have `tenant_id`.
- Every tenant-owned query must filter by tenant.
- Important entities need `created_at` and `updated_at`.
- Event/audit tables must be append-only.
- Add indexes for common filters.
- Add tenant-scoped unique constraints for asset tags, serial numbers, category/type names where relevant.
- Seed roles and permissions.
- Do not implement UI in this phase unless already required by health/admin seed verification.
- Do not add forbidden dependencies.

## Tests

Add tests for:

- migration applies
- seed idempotency
- tenant creation
- role/permission seed
- location hierarchy constraints
- duplicate asset tag blocked
- duplicate serial number blocked
- foreign key behavior
- audit log append-only repository behavior

## Verification

Run:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm check
pnpm build
RUN_DB_TESTS=1 pnpm test
```

## Completion

Update:

```text
docs/engineering/PROJECT_PROGRESS.md
docs/engineering/features/02-database-foundation.md
```

Final report must include:

1. tables created
2. migrations created
3. repositories created
4. tests added
5. commands run
6. test results
7. known gaps
8. next task
