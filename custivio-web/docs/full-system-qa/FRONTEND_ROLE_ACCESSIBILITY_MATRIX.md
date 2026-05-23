# Frontend Role Accessibility Matrix

Source of truth: backend UAT seed role permissions in `custivio/packages/db/src/seed.ts`.
Frontend policy: `src/lib/permission-policy.ts`.

Statuses: `PENDING`, `PASS`, `FAIL`, `BLOCKED`, `ACCEPTED_RISK`.

| Role            | Expected sidebar/pages                                                                                      | Hidden pages                                                     | Allowed write/action UI                                                                                           | Direct forbidden URL behavior                                          | API/network expectation                                                                                        | Test status | Evidence                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| Administrator   | Dashboard, Assets, Catalog, Stock, Custody, Maintenance, Audit & Reports, Users, Roles, Assignments, Status | None                                                             | All asset, catalog, location, stock, custody, maintenance, audit/import/report, user, role and assignment actions | N/A                                                                    | No forbidden page-load requests                                                                                | PASS        | `permission-policy.test.ts`; browser/E2E rerun blocked because no local servers were listening |
| Asset Manager   | Dashboard, Assets, Catalog, Stock, Custody, Maintenance, Status                                             | Audit & Reports, Users, Roles, Assignments                       | Asset/catalog/location/custody/maintenance writes; stock writes hidden; audit page hidden                         | Friendly access denied on hidden pages; no audit/report overview calls | No `/api/audits/*`, `/api/imports/*`, or `/api/reports/*` calls from dashboard or direct Audit & Reports route | PASS        | `permission-policy.test.ts`; route/page guards now prevent forbidden dashboard/reporting calls |
| Inventory Clerk | Dashboard, Assets, Stock, Custody, Status                                                                   | Catalog, Maintenance, Audit & Reports, Users, Roles, Assignments | Stock writes; asset/custody/admin/audit/maintenance writes hidden                                                 | Friendly access denied on hidden pages                                 | No admin/catalog/maintenance/audit/report page-load calls from hidden routes                                   | PASS        | `permission-policy.test.ts`; route/page guards now disable forbidden queries                   |
| Auditor         | Dashboard, Assets, Stock, Custody, Maintenance, Audit & Reports, Status                                     | Catalog, Users, Roles, Assignments                               | Audit campaign/scan; asset/stock/custody/maintenance write controls hidden; import/export writes hidden           | Friendly access denied on hidden pages                                 | Maintenance page must not call admin users API; no admin/catalog page-load calls                               | PASS        | `permission-policy.test.ts`; maintenance page no longer calls admin users API                  |

## Automated Checks Added

- Central route and action permission matrix tests for all four seeded roles.
- Regression check that Asset Manager cannot access combined Audit & Reports.
- Route pages now disable backend queries when the current role lacks the page permission.
- Write controls are hidden behind action-level permission checks.

## Command Evidence

| Command             | Result             | Evidence                                                                                                     |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck` | PASS               | TypeScript completed with no errors.                                                                         |
| `npm run test`      | PASS               | Vitest passed: 4 files, 26 tests.                                                                            |
| `npm run lint`      | PASS_WITH_WARNINGS | ESLint exited 0; six existing shadcn Fast Refresh warnings remain.                                           |
| `npm run build`     | PASS               | Vite client and SSR production builds completed.                                                             |
| `npm run test:e2e`  | BLOCKED            | Required env was missing on first run; rerun with UAT env failed because backend/frontend servers were down. |

## Manual QA Checklist For Next Browser Run

1. Seed UAT data and log in as each UAT user.
2. Compare sidebar labels with this matrix.
3. Visit every hidden URL directly and verify the friendly access-denied panel appears.
4. Confirm the browser network tab has no unexpected `403` page-load responses.
5. Confirm write controls only appear for roles listed in the allowed action column.
