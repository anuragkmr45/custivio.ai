# Custivio User Persona Permission Matrix

Report date: 2026-05-22

Source files:

- `packages/db/src/seed.ts`
- `packages/db/src/seed-uat.ts`
- `custivio-web/src/lib/permission-policy.ts`

| Persona            | Permissions                                                                                                                | Pages visible                                                          | Actions allowed                                                              | Actions denied                                                                      | UAT user               | Status   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- | -------- |
| Administrator      | All seeded permissions                                                                                                     | All protected product areas                                            | All seeded UI actions and backend mutations                                  | None in normal tenant scope                                                         | `UAT_ADMIN_EMAIL`      | COMPLETE |
| Asset Manager      | `locations.manage`, `catalog.manage`, `assets.*`, `custody.*`, `maintenance.*`, `imports.*`, `inventory.read`, `reports.*` | Dashboard, catalog, assets, stock, custody, maintenance, status        | Catalog/location setup, assets, custody, maintenance, imports, reports       | Admin users/roles, stock mutation, audits                                           | `UAT_MANAGER_EMAIL`    | COMPLETE |
| Inventory Clerk    | `assets.read`, `custody.read`, `imports.*`, `inventory.*`, `reports.*`                                                     | Dashboard, assets, stock, custody, status                              | Stock receive/issue/adjust, import jobs, reports                             | Admin/catalog/location/asset mutation, custody mutation, audits                     | `UAT_STORE_EMAIL`      | COMPLETE |
| Technician         | `assets.read`, `custody.*`, `maintenance.*`, `inventory.read`, `reports.read`                                              | Dashboard, assets, stock, custody, maintenance, status                 | Custody handover/checkin/checkout where backend permits, maintenance updates | Admin/catalog/location/stock mutation/import/export mutation/audits                 | `UAT_TECHNICIAN_EMAIL` | COMPLETE |
| Manager / Approver | `assets.read`, `custody.*`, `maintenance.read`, `inventory.read`, `audits.read`, `reports.*`                               | Dashboard, assets, stock, custody, maintenance, status                 | Transfer/custody decisions and reports                                       | Admin/catalog/location/asset mutation/stock mutation/import mutation/audit mutation | `UAT_APPROVER_EMAIL`   | COMPLETE |
| Auditor            | `assets.read`, `custody.read`, `maintenance.read`, `imports.read`, `inventory.read`, `audits.*`, `reports.read`            | Dashboard, assets, stock, custody, maintenance, audits/reports, status | Audit campaigns/scans, read reports                                          | Admin/catalog/location/asset/stock/custody/maintenance/import/export mutation       | `UAT_AUDITOR_EMAIL`    | COMPLETE |
| Read-only Viewer   | `assets.read`, `custody.read`, `maintenance.read`, `imports.read`, `inventory.read`, `audits.read`, `reports.read`         | Dashboard, assets, stock, custody, maintenance, audits/reports, status | Read-only navigation and downloads allowed by backend                        | All mutations                                                                       | `UAT_VIEWER_EMAIL`     | COMPLETE |

## Validation

| Check                                                              | Result | Evidence                                                                  |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| Base seed roles cover seven personas                               | PASS   | `roleDefinitions` in `packages/db/src/seed.ts`                            |
| UAT seed creates seven login-capable users                         | PASS   | `RUN_DB_TESTS=1 npx vitest run tests/integration/uat-seed.test.ts`        |
| Production bootstrap creates administrator without UAT credentials | PASS   | `RUN_DB_TESTS=1 npx vitest run tests/integration/bootstrap-admin.test.ts` |
| Frontend route/action policy covers seven seeded roles             | PASS   | `npm run test -- src/lib/permission-policy.test.ts`                       |
