# Target UI Modules

## Shell

- Authenticated dashboard shell with sidebar, top search, tenant/site switcher, notifications, user menu.
- Dense operational layout optimized for repeated admin/operator use.

## Modules

- Dashboard: asset counts, stock alerts, maintenance backlog, warranty expiry, audit compliance.
- Assets: table/grid, advanced filters, saved views, create/edit/view, attachments, event history, QR/barcode actions.
- Asset configuration: categories, types, custom fields, manufacturers, models, vendors.
- Locations: hierarchy browser for sites/buildings/floors/rooms/racks/bins.
- Custody: assigned assets, transfer queue, check-in/check-out, handover documents.
- Stock: items, balances, receive/issue/transfer/adjust workflows, low-stock rules.
- Maintenance: tickets, schedules, repair logs, warranty records, vendor work.
- Audit: campaigns, scan/verify screen, findings, submission, reports.
- Imports/exports: templates, upload preview, row errors, job status, generated files.
- Admin: users, roles, permissions, groups, audit logs, system settings.
- Observability/admin ops: health, queue status, storage status, version/build info.

## UI Acceptance Rules

- Every table supports search, filter, pagination, loading, empty, and error states.
- Every mutation has optimistic or clear pending state and permission-aware disabled state.
- Attachment actions must show upload progress and permission errors.
- QR/scanner flows must handle camera denial, invalid code, duplicate, and offline state.

