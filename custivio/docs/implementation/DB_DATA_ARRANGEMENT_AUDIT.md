# Custivio DB And Data Arrangement Audit

Report date: 2026-05-22

## Current Finding

The base seed is suitable for system records and roles/permissions. UAT seed provides local demo data. Production bootstrap is now CLI-based and creates the first tenant/admin only from explicit operator-provided environment variables.

| Area                           | Tables                                                              | UI exists           | API exists               | Setup method                                                   | Real-user ready? | Gap                                                                                               |
| ------------------------------ | ------------------------------------------------------------------- | ------------------- | ------------------------ | -------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| Tenant                         | `tenants`                                                           | Partial             | Seed/auth context        | Base seed and bootstrap CLI                                    | READY            | `pnpm db:bootstrap-admin` creates or updates first tenant from env values.                        |
| Organization/departments       | `organizations`, `departments`                                      | No dedicated UI     | Seed/repository          | UAT seed; operator-created through admin workflow where needed | READY_WITH_NOTES | Dedicated production organization setup UI remains future; not a P1 blocker for tenant bootstrap. |
| Users                          | `users`, `password_credentials`                                     | Yes                 | Admin API                | UI, UAT seed, bootstrap CLI                                    | READY            | First administrator bootstrap is env-driven and idempotent.                                       |
| Roles/permissions              | `roles`, `permissions`, `role_permissions`, `user_role_assignments` | Yes                 | Admin API                | Base seed, UI                                                  | READY            | Seven-persona base role model is seeded.                                                          |
| Locations                      | `sites`, `buildings`, `floors`, `rooms`, `racks`, `shelves`, `bins` | Yes                 | Location API             | UI and UAT seed                                                | READY            | Browser route and API smoke validation passed.                                                    |
| Catalog                        | Asset category/type/custom field/manufacturer/model/vendor tables   | Yes                 | Catalog API              | UI and UAT seed                                                | READY            | API smoke and frontend validation passed.                                                         |
| Assets/attachments/lifecycle   | Asset tables                                                        | Yes                 | Asset API                | UI and UAT seed                                                | READY            | Server pagination, browser asset create/detail, attachment upload/download/delete passed.         |
| Stock                          | Stock unit/item/balance/ledger/rule tables                          | Yes                 | Stock API                | UI and UAT seed                                                | READY_WITH_NOTES | API smoke and DB tests pass; broader browser mutation coverage is P2.                             |
| Custody/transfers              | Custody and transfer tables                                         | Yes                 | Custody/transfer API     | UI and UAT seed                                                | READY_WITH_NOTES | API smoke and DB tests pass; broader browser mutation coverage is P2.                             |
| Maintenance/warranty           | Maintenance and warranty tables                                     | Yes                 | Maintenance API          | UI and UAT seed                                                | READY_WITH_NOTES | API smoke and DB tests pass; broader browser mutation coverage is P2.                             |
| Audits/imports/exports/reports | Audit/reporting tables                                              | Yes                 | Audit/import/report APIs | UI and UAT seed                                                | READY_WITH_NOTES | API smoke, backend tests, job polling UI, and browser route validation passed.                    |
| Audit logs                     | `audit_logs`                                                        | No dedicated viewer | Internal append          | Services                                                       | READY_WITH_NOTES | Mutation logging is tested where workflows assert audit entries; audit-log viewer is future.      |

## Completed Fixes

- Added `pnpm db:bootstrap-admin` with required `BOOTSTRAP_*` env values.
- Expanded seeded roles/UAT users to seven real-user personas.
- Made UAT seed credentials lazy so production DB package imports do not require demo env vars.
- Verified bootstrap validation, bootstrap DB idempotency, seven-persona UAT seed, and frontend permission policy.

## Final Validation

- `pnpm db:migrate` passed.
- `pnpm db:seed` passed twice.
- `pnpm db:seed:uat` passed twice with seven-persona env values.
- `RUN_DB_TESTS=1 pnpm test` passed 26 files and 103 tests.

## Remaining Work

- Dedicated organization/department setup UI is a future improvement, not a blocker for tenant/admin bootstrap.
- Broader browser-click UAT for every master-data mutation can be added as P2 coverage.
