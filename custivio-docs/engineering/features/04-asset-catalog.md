# Phase 4: Asset Catalog

## Requirement

Implement tenant-scoped asset catalog management for categories, types, custom fields, manufacturers, models, and vendors.

## Scope

- Core catalog services with validation and permission checks.
- Catalog route handlers for list, create, update, and archive.
- Catalog admin UI for overview and creation forms.
- Audit logs for catalog mutations.
- Integration tests for duplicate keys, custom field validation, archive protection, and audit logging.

## Out Of Scope

- Asset registry CRUD.
- Attachment uploads.
- Catalog import/export.
- Rich client-side editing.

## Affected Folders

- `packages/core/src/catalog`
- `packages/db/src/repositories`
- `apps/web/app/api/catalog`
- `apps/web/app/(app)/catalog`
- `tests/integration`
- `docs/engineering`

## DB Changes

- No new tables expected. Existing Phase 2 catalog tables are used.

## API/Server Actions

- `GET /api/catalog/[resource]`
- `POST /api/catalog/[resource]`
- `PATCH /api/catalog/[resource]/[id]`
- `DELETE /api/catalog/[resource]/[id]`
- Catalog page server actions for creation/archive workflows.

## UI Screens

- `/catalog`

## Permission Rules

- Catalog management requires `catalog.manage`.
- All reads and writes are tenant-scoped through the authenticated session.

## Audit Log Rules

- Create/update/archive actions write catalog audit events with request ID when available.

## Tests

- Duplicate category/type keys are rejected by the database.
- Invalid custom field option configuration is rejected by service validation.
- Archive category/type fails when dependent records exist.
- Catalog mutations write audit logs.

## Product Manager UAT Checklist

- Non-technical usability: catalog forms use plain labels.
- Empty state: catalog page handles empty lists.
- Error state: API returns typed validation/authorization errors.
- Success feedback: created records appear in catalog overview after submit.
- Business labels: categories, asset types, manufacturers, models, vendors, and custom fields use inventory terms.
- End-to-end workflow: authorized user can create catalog records needed for asset registration.
- Inventory usefulness: supports later asset registry phase.
- UAT status: `passed`.

## Rollback/Migration Notes

- No schema migration expected.
- Catalog archive is soft status change, not destructive deletion.

## Commands Run

- `pnpm install`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm format:check`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `RUN_DB_TESTS=1 pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm --dir apps/web exec next dev --hostname 127.0.0.1 --port 3007`
- `curl -sS -i -c /tmp/eip-phase4-cookies.txt ... /api/auth/login`
- `curl -sS -i -b /tmp/eip-phase4-cookies.txt ... /api/catalog/categories`
- `curl -sS -i -b /tmp/eip-phase4-cookies.txt ... /catalog`

## Verification Result

- Drizzle reported no schema changes for Phase 4.
- Formatting, typecheck, lint, unit tests, forbidden dependency scan, migration gate, seed gate, DB integration tests, build, and HTTP route/page smoke checks passed.
- `RUN_DB_TESTS=1 pnpm test` passed with 25 tests enabled.
- Catalog category creation returned 201, catalog list returned 200, and `/catalog` rendered through the protected app shell.

## Known Gaps

- Rich editing, delete confirmation UI, and import/export are later phases.
