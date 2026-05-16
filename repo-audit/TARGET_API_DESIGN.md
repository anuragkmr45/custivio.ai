# Target API Design

## API Style

Use Next.js route handlers/server actions backed by service functions in `packages/core`. Keep validation and permission checks in shared helpers so UI and API paths cannot diverge.

## Required API Areas

- Auth/session: login, logout, current user, password reset, user activation/deactivation.
- Admin/RBAC: users, roles, permissions, groups, scoped assignments.
- Locations: sites, buildings, floors, rooms, racks, shelves/bins.
- Asset catalog: categories, types, fields, manufacturers, models, vendors.
- Assets: CRUD, search/filter, assignment, status/condition changes, attachments, QR/barcode payload.
- Stock: receive, issue, transfer, adjust, balance view, low-stock rules.
- Custody: check-out, check-in, transfer request, approvals, handover export.
- Maintenance: ticket create/update/assign/close, schedules, warranty, repair records, downtime.
- Audit: campaign create, assignment, scan/verify, finding, submit, reopen, report export.
- Imports/exports: template download, upload, preview, process, retry, export download.
- Observability: `/api/health/live`, `/api/health/ready`, `/api/metrics`.

## Cross-Cutting Rules

- Validate all input with Zod or equivalent.
- Require tenant and permission context on every protected mutation.
- Use Valkey idempotency keys for imports, exports, QR bulk jobs, and repeated mutations.
- Persist audit logs for all security, asset, stock, custody, maintenance, and audit mutations.
- Return typed errors with request IDs; never expose raw DB errors to users.

