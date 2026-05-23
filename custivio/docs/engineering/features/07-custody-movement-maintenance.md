# Phase 7: Custody, Movement, And Maintenance

## Requirement

Implement operational asset custody, handover, transfer approval, warranty, and maintenance workflows with tenant isolation, permission checks, audit logs, and state transition tests.

## Scope

- Drizzle schema for custody assignments, transfer requests, maintenance tickets, maintenance events, and warranty records.
- Transactional repository functions for checkout, check-in, handover, transfer decisions, and maintenance state changes.
- Core operation services with validation, permission checks, audit logs, and asset lifecycle entries.
- Route handlers and server actions for custody, transfers, warranties, and maintenance tickets.
- Custody and maintenance UI pages.
- Integration tests for checkout/check-in/handover, transfer approval/rejection, maintenance resolution, and tenant-scoped reads.

## Out Of Scope

- Multi-step approval chains.
- Calendar scheduling.
- Technician workload planning.
- Spare-part consumption from maintenance tickets.
- Email notifications.

## Affected Folders

- `packages/db/src/schema`
- `packages/db/src/repositories`
- `packages/db/src/seed.ts`
- `packages/core/src/operations`
- `apps/web/app/api/custody`
- `apps/web/app/api/transfers`
- `apps/web/app/api/maintenance`
- `apps/web/app/(app)/custody`
- `apps/web/app/(app)/maintenance`
- `tests/integration`
- `docs/engineering`

## DB Changes

- Add `asset_custody_assignments`.
- Add `asset_transfer_requests`.
- Add `asset_maintenance_tickets`.
- Add `asset_maintenance_events`.
- Add `asset_warranties`.
- Add custody and maintenance permission seed entries.

## API/Server Actions

- `GET /api/custody/checkouts`
- `POST /api/custody/checkouts`
- `POST /api/custody/checkins`
- `POST /api/custody/handovers`
- `GET /api/transfers`
- `POST /api/transfers`
- `POST /api/transfers/[id]/decision`
- `GET /api/maintenance/tickets`
- `POST /api/maintenance/tickets`
- `POST /api/maintenance/tickets/[id]/status`
- `GET /api/maintenance/warranties`
- `POST /api/maintenance/warranties`

## UI Screens

- `/custody`
- `/maintenance`

## Permission Rules

- Custody reads require `custody.read`.
- Custody mutations and transfer decisions require `custody.write`.
- Maintenance reads require `maintenance.read`.
- Maintenance mutations require `maintenance.write`.
- All reads and writes are scoped to the authenticated tenant.

## Audit Log Rules

- Checkout, check-in, handover, transfer request, transfer decision, ticket creation, ticket status change, and warranty creation write audit logs.
- Asset state changes also write asset lifecycle events.

## Tests

- Checkout assigns a custodian and moves an asset to `in_use`.
- Check-in clears the custodian and moves the asset to `in_stock`.
- Handover closes the previous assignment and opens a new active assignment.
- Transfer approval updates the request and custodian; rejection does not mutate the asset.
- Maintenance ticket creation moves the asset to `maintenance`; resolution restores the requested asset status.
- Tenant-scoped overview does not leak other tenant records.

## Product Manager UAT Checklist

- Non-technical usability: custody and maintenance labels match asset operations.
- Empty state: tables show clear no-record rows.
- Error state: invalid states return typed errors.
- Success feedback: tables reflect custody, transfer, and maintenance state changes.
- Business labels: asset tag, custodian, requester, approver, priority, status, and warranty dates are visible.
- End-to-end workflow: authorized user can check out an asset, hand it over, check it in, request/decide transfer, open maintenance, resolve it, and record warranty.
- Inventory usefulness: supports operational accountability and repair tracking.
- UAT status: `passed`.

## Rollback/Migration Notes

- Migration is additive.
- Custody, transfer, maintenance, and warranty records are operational history and should not be deleted during normal rollback.

## Commands Run

- `pnpm typecheck` - passed.
- `pnpm lint` - passed.
- `pnpm format` - passed.
- `pnpm db:generate` - passed and created `packages/db/src/migrations/0004_hard_silvermane.sql`.
- `pnpm db:migrate` - passed.
- `pnpm db:seed` - passed twice.
- `RUN_DB_TESTS=1 pnpm test` - passed, 36 tests across 10 files.
- `pnpm check` - passed.
- `pnpm build` - passed outside sandbox after sandbox-only Turbopack worker port failure.
- HTTP smoke on `127.0.0.1:3010` - login, catalog setup, asset create, custody checkout, handover, check-in, transfer request, transfer approval, maintenance open, maintenance resolve, warranty create, custody overview, maintenance overview, custody page, maintenance page, live health, readiness, and metrics all returned 200/201.

## Verification Result

- Manual QA result: passed.
- PM/UAT result: passed.
- The custody page gives an operator clear controls for checkout, check-in, handover, transfer request, and transfer decision.
- The maintenance page gives an operator clear controls for opening and resolving tickets and recording warranty coverage.
- State transitions were verified in DB-backed tests and HTTP smoke.

## Known Gaps

- Multi-step approvals and notifications are later work.
- Spare-part consumption from maintenance tickets is later work.
