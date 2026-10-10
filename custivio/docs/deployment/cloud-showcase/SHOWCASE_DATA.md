# Cloud Showcase Data

Custivio includes a separate, idempotent showcase seed for cloud demonstrations. It does not run as part of the normal on-prem or production seed and does not add a default password.

## Scope

The dataset represents a fictional Indian technology company and covers:

- tenant administrator, seven RBAC roles, ten users, organizations, and departments;
- Bengaluru, Mumbai, and Hyderabad sites with buildings, floors, rooms, racks, shelves, and bins;
- catalog categories, asset types, custom fields, manufacturers, models, and vendors;
- twenty serialized assets with QR/barcode identifiers, lifecycle events, custody, and transfers;
- maintenance tickets, maintenance events, and warranty/support contracts;
- stock units, ten stock items, balances, low-stock rules, ledger entries, an adjustment, and a transfer;
- two audit campaigns, scan results, a finding, import history, export history, saved filters, and audit history.

Names, email addresses, serial numbers, purchase orders, and contract references are realistic fictional values. Domains ending in `.example` are intentionally non-deliverable.

## Required environment

The seed reuses the explicit bootstrap administrator variables:

```dotenv
BOOTSTRAP_TENANT_SLUG=northstar-digital
BOOTSTRAP_TENANT_NAME=Northstar Digital Services Pvt. Ltd.
BOOTSTRAP_ADMIN_EMAIL=admin@northstar.example
BOOTSTRAP_ADMIN_NAME=Aarav Sharma
BOOTSTRAP_ADMIN_PASSWORD=<unique-random-password-at-least-12-characters>
```

`DATABASE_URL` must identify the intended PostgreSQL database. Never commit the password or a live database URL.

## Run

Apply migrations, then seed:

```bash
pnpm db:migrate
pnpm db:seed:showcase
```

The command can be run again safely. Natural keys and idempotency keys update showcase records instead of duplicating them.

## API validation

After deployment, sign in using the configured tenant slug, administrator email, and password. Validate:

```text
GET  /api/auth/me
GET  /api/admin/users
GET  /api/locations/sites
GET  /api/catalog/categories
GET  /api/assets?limit=100
GET  /api/custody/checkouts
GET  /api/transfers
GET  /api/maintenance/tickets
GET  /api/stock/items
GET  /api/audits/campaigns
GET  /api/imports/jobs
GET  /api/reports/exports
GET  /api/reports/filters
```

Use `POST /api/reports/exports` and `POST /api/assets/{id}/attachments` to validate that downloadable objects are physically present in S3-compatible storage. Database-only attachment metadata must never be fabricated.

## Safety boundary

- The seed is opt-in and is not included in `start`, `start:cloud`, or Compose startup.
- Run it only against a dedicated demonstration tenant/database.
- It never deletes existing records.
- It does not grant passwords to fictional persona users; only the explicitly configured bootstrap administrator can sign in.
