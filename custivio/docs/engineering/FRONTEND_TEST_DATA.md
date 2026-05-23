# Frontend Test Data

Use this document after local services are running and both seeds have been applied:

```bash
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm db:seed:uat
```

The UAT seed is local/dev only. Do not ship these users as production bootstrap credentials.
Emails and password are read from backend env keys in `.env`.

## Tenant And Users

Tenant slug: `default`

| Role               | Email                  | Password            | Permissions                                      |
| ------------------ | ---------------------- | ------------------- | ------------------------------------------------ |
| Administrator      | `UAT_ADMIN_EMAIL`      | `UAT_SEED_PASSWORD` | all seeded permissions                           |
| Asset manager      | `UAT_MANAGER_EMAIL`    | `UAT_SEED_PASSWORD` | catalog/assets/custody/maintenance/import/report |
| Store user         | `UAT_STORE_EMAIL`      | `UAT_SEED_PASSWORD` | stock/import/report read/write                   |
| Technician         | `UAT_TECHNICIAN_EMAIL` | `UAT_SEED_PASSWORD` | custody/maintenance write, asset/stock read      |
| Manager / Approver | `UAT_APPROVER_EMAIL`   | `UAT_SEED_PASSWORD` | custody/report write, operational read           |
| Auditor            | `UAT_AUDITOR_EMAIL`    | `UAT_SEED_PASSWORD` | audit/report read flows                          |
| Read-only Viewer   | `UAT_VIEWER_EMAIL`     | `UAT_SEED_PASSWORD` | read-only operational and report access          |

## Seeded Records

| Area               | Stable keys                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| Organization       | `ITOPS`                                                                       |
| Departments        | `IT-INFRA`, `IT-STORE`                                                        |
| Location hierarchy | `HQ`, `HQ-A`, `01`, `IT-STOR`, `RACK-A1`, `SHELF-A`, `BIN-SPARES-A`           |
| Categories         | `hardware`, `network`, `consumables`, `components`, `cables`                  |
| Asset types        | `laptop`, `server`, `network-switch`                                          |
| Assets             | `UAT-LAP-001`, `UAT-SRV-001`, `UAT-NET-001`                                   |
| Stock SKUs         | `UAT-CABLE-CAT6-1M`, `UAT-CONS-THERMAL-PASTE`, `UAT-CHIP-TPM-2`               |
| Audit              | `UAT Q2 Hardware Audit`, scan code `qr:UAT-NET-001`                           |
| Imports            | idempotency key `uat-seed-import-assets`, source file `uat-assets-import.csv` |
| Exports            | idempotency key `uat-seed-export-assets`, metadata-only pending export        |

## Frontend Notes

- Resolve UUIDs with list endpoints before calling create/update/mutation APIs.
- The seeded export job is not a downloadable MinIO object; create a fresh export with `POST /api/reports/exports` to test download.
- Attachment objects are intentionally API-generated. Upload a fixture through `POST /api/assets/{id}/attachments` to test attachment metadata and download.
- Idempotent examples should generate unique keys per user action. Reusing a key with changed payload returns `409 idempotency_conflict`.
