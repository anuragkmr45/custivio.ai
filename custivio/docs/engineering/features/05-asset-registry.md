# Phase 5: Asset Registry

## Requirement

Implement tenant-scoped fixed asset registration, search/list, detail, lifecycle events, attachments, and QR/barcode payload generation.

## Scope

- Core asset registry services with permission checks.
- Asset route handlers for list, create, detail, update, lifecycle, and attachment upload.
- Asset list and detail UI.
- MinIO-backed attachment object writes through the storage package.
- Lifecycle event timeline.
- Duplicate tag/serial and attachment authorization tests.

## Out Of Scope

- Stock/consumable ledgers.
- Custody transfer workflows.
- Maintenance workflows.
- Bulk import/export.
- Generated printable labels.

## Affected Folders

- `packages/db/src/repositories`
- `packages/core/src/assets`
- `packages/storage/src`
- `apps/web/app/api/assets`
- `apps/web/app/(app)/assets`
- `tests/integration`
- `docs/engineering`

## DB Changes

- No new tables expected. Existing Phase 2 asset, identifier, attachment, and lifecycle tables are used.

## API/Server Actions

- `GET /api/assets`
- `POST /api/assets`
- `GET /api/assets/[id]`
- `PATCH /api/assets/[id]`
- `POST /api/assets/[id]/lifecycle`
- `POST /api/assets/[id]/attachments`

## UI Screens

- `/assets`
- `/assets/[id]`

## Permission Rules

- Asset reads require `assets.read`.
- Asset mutations and attachment uploads require `assets.write`.
- All records are tenant-scoped through the authenticated session.

## Audit Log Rules

- Asset create/update, lifecycle append, and attachment upload write audit logs.

## Tests

- Duplicate asset tag and serial are rejected.
- Unauthorized attachment upload is rejected before object write.
- Authorized attachment upload writes object metadata and lifecycle/audit events.

## Product Manager UAT Checklist

- Non-technical usability: asset forms use plain labels.
- Empty state: asset list handles no assets.
- Error state: API returns typed validation/authorization errors.
- Success feedback: created assets appear in list and detail pages.
- Business labels: asset tag, serial number, model, condition, status, lifecycle, and attachments are visible.
- End-to-end workflow: authorized user can create an asset and attach evidence.
- Inventory usefulness: supports real asset registry workflows.
- UAT status: `passed`.

## Rollback/Migration Notes

- No schema migration expected.
- Attachment object writes are additive and stored under tenant/asset prefixes.

## Commands Run

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm format:check`
- `pnpm docker:dev`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `RUN_DB_TESTS=1 pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm --dir apps/web exec next dev --hostname 127.0.0.1 --port 3008`
- `curl -sS -i -c /tmp/eip-phase5-cookies.txt ... /api/auth/login`
- `curl -sS ... /api/catalog/types`
- `curl -sS -i -b /tmp/eip-phase5-cookies.txt ... /api/assets`
- `curl -sS -i -b /tmp/eip-phase5-cookies.txt ... /api/assets/[id]`
- `curl -sS -i -b /tmp/eip-phase5-cookies.txt ... /assets/[id]`
- `curl -sS -i -b /tmp/eip-phase5-cookies.txt -F file=@README.md ... /api/assets/[id]/attachments`

## Verification Result

- Drizzle reported no schema changes for Phase 5.
- Formatting, typecheck, lint, unit tests, forbidden dependency scan, migration gate, seed gate, DB/MinIO integration tests, build, and HTTP route/page smoke checks passed.
- `RUN_DB_TESTS=1 pnpm test` passed with 29 tests enabled.
- Asset creation returned 201; asset detail returned QR/lifecycle data; asset detail page rendered; attachment upload returned 201; and the attachment appeared in asset detail.

## Known Gaps

- Attachment download/delete, printable QR labels, and advanced search filters are later work.
