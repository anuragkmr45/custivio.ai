# Admin Guide

## Daily Checks

- Open `/admin/status` and confirm PostgreSQL, Valkey, and MinIO are ready.
- Review recent audit logs for unexpected login failures or operational changes.
- Confirm backup jobs completed and backup media is protected.

## User And Access Operations

- Use the Users, Roles, and Assignments screens to review tenant access.
- Do not create shared accounts.
- Rotate credentials through approved identity workflows when that phase is implemented.

## Inventory Operations

- Use Catalog before creating assets so asset types, manufacturers, models, and vendors are
  controlled.
- Use Assets for fixed equipment and Stock for consumables, spares, cables, and parts.
- Use Custody and Maintenance to preserve operational history.
- Use Audit & Reports for scan campaigns, imports, exports, and saved views.

## Release Operations

- Follow `docs/operations/RELEASE_CHECKLIST.md`.
- Keep backup and restore evidence with the release ticket.
- Do not deploy if any required gate fails.
