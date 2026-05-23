# Phase 6: Stock And Consumables

## Requirement

Implement stock and consumable management with immutable ledger entries, balances, adjustments, transfers, and low-stock reporting.

## Scope

- Drizzle schema for units, stock items, balances, ledger entries, adjustments, transfers, and low-stock rules.
- Transactional stock movement repository.
- Core stock services with permission checks.
- Stock unit, item, and movement API routes.
- Stock UI with item creation, receive, issue, transfer, adjust, balances, ledger, and low-stock view.
- Integration tests for ledger immutability surface, negative stock prevention, and transaction consistency.

## Out Of Scope

- Purchase orders.
- Vendor receiving documents.
- Barcode scanning.
- Approval workflows.
- Forecasting.

## Affected Folders

- `packages/db/src/schema`
- `packages/db/src/repositories`
- `packages/core/src/stock`
- `apps/web/app/api/stock`
- `apps/web/app/(app)/stock`
- `tests/integration`
- `docs/engineering`

## DB Changes

- Add stock unit, item, balance, ledger, adjustment, transfer, and low-stock rule tables.

## API/Server Actions

- `GET /api/stock/items`
- `POST /api/stock/units`
- `POST /api/stock/items`
- `POST /api/stock/movements`

## UI Screens

- `/stock`

## Permission Rules

- Stock reads require `inventory.read`.
- Stock mutations require `inventory.write`.
- All rows are tenant-scoped through the authenticated session.

## Audit Log Rules

- Stock unit creation, stock item creation, and movements write audit logs.
- Ledger rows are append-only through repository APIs.

## Tests

- Receive creates balance and ledger row.
- Issue cannot make stock negative.
- Failed issue does not write ledger or mutate balance.
- Transfer moves quantity between locations.
- Low-stock report identifies items below threshold.

## Product Manager UAT Checklist

- Non-technical usability: stock forms use receiving, issue, transfer, and adjust labels.
- Empty state: stock page handles no rows.
- Error state: API returns typed insufficient-stock errors.
- Success feedback: balances and ledger reflect completed movement.
- Business labels: SKU, unit, balance, movement, location, and low-stock threshold are visible.
- End-to-end workflow: authorized user can create SKU, receive stock, issue stock, and see low-stock status.
- Inventory usefulness: supports consumables, spares, cables, and components.
- UAT status: `passed`.

## Rollback/Migration Notes

- Migration is additive.
- Ledger rows are append-only and should not be deleted during normal rollback.

## Commands Run

- `pnpm check` - passed.
- `pnpm build` - passed outside sandbox after sandbox-only Turbopack worker port failure.
- `pnpm db:generate` - passed and created `packages/db/src/migrations/0003_careful_wraith.sql`.
- `pnpm db:migrate` - passed.
- `pnpm db:seed` - passed.
- `RUN_DB_TESTS=1 pnpm test` - passed, 33 tests across 9 files.
- HTTP smoke on `127.0.0.1:3009` - login, stock unit create, stock item create, receive, issue, stock overview, `/stock`, live health, readiness, and metrics all returned 200/201.

## Verification Result

- Manual QA result: passed.
- PM/UAT result: passed.
- The stock screen exposes understandable forms for unit, SKU, movement, balances, low-stock, and ledger review.
- The smoke workflow confirmed a non-technical inventory operator can create a unit, create a stock item, receive stock, issue stock, and see balances/ledger update.

## Known Gaps

- Purchase order receiving and approval workflows are later work.
- Bin/location selection is currently a free-text location key; richer managed bins are future work.
