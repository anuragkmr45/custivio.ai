# Custivio User Persona UI Matrix

Report date: 2026-05-22

Source files:

- `src/lib/permission-policy.ts`
- `src/lib/permission-policy.test.ts`
- `custivio/docs/implementation/USER_PERSONA_PERMISSION_MATRIX.md`

| Persona            | Permissions                                                                   | Pages visible                                                                                              | Actions allowed                                                                    | Actions denied                                                                                                           | UAT user               | Status   |
| ------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------- | -------- |
| Administrator      | All seeded permissions                                                        | Dashboard, assets, catalog, stock, custody, maintenance, audits/reports, users, roles, assignments, status | All configured actions                                                             | None in normal tenant scope                                                                                              | `UAT_ADMIN_EMAIL`      | COMPLETE |
| Asset Manager      | Catalog/location/assets/custody/maintenance/import/report plus inventory read | Dashboard, assets, catalog, stock, custody, maintenance, status                                            | Asset, attachment, catalog, location, custody, maintenance, import, report actions | Users, roles, assignments, audit mutation, stock mutation                                                                | `UAT_MANAGER_EMAIL`    | COMPLETE |
| Inventory Clerk    | Stock/import/report write plus asset/custody read                             | Dashboard, assets, stock, custody, status                                                                  | Attachment download, stock write, import write, report write                       | Admin, catalog, location, asset mutation, custody mutation, maintenance mutation, audit mutation                         | `UAT_STORE_EMAIL`      | COMPLETE |
| Technician         | Custody/maintenance write plus asset/stock/report read                        | Dashboard, assets, stock, custody, maintenance, status                                                     | Attachment download, custody write, maintenance write                              | Admin, catalog, location, stock mutation, import/export mutation, audit mutation                                         | `UAT_TECHNICIAN_EMAIL` | COMPLETE |
| Manager / Approver | Custody/report write plus asset/maintenance/stock/audit read                  | Dashboard, assets, stock, custody, maintenance, status                                                     | Attachment download, custody write, report write                                   | Admin, catalog, location, asset mutation, stock mutation, import mutation, audit mutation                                | `UAT_APPROVER_EMAIL`   | COMPLETE |
| Auditor            | Audit write plus read-only operational access                                 | Dashboard, assets, stock, custody, maintenance, audits/reports, status                                     | Attachment download, audit write                                                   | Admin, catalog, location, asset mutation, custody mutation, stock mutation, maintenance mutation, import/export mutation | `UAT_AUDITOR_EMAIL`    | COMPLETE |
| Read-only Viewer   | Read-only operational/reporting access                                        | Dashboard, assets, stock, custody, maintenance, audits/reports, status                                     | Attachment download                                                                | All mutations                                                                                                            | `UAT_VIEWER_EMAIL`     | COMPLETE |

## Validation

| Check                                             | Result | Evidence                                            |
| ------------------------------------------------- | ------ | --------------------------------------------------- |
| Permission policy includes seven seeded role keys | PASS   | `src/lib/permission-policy.ts`                      |
| Route visibility matrix passes                    | PASS   | `npm run test -- src/lib/permission-policy.test.ts` |
| Action visibility matrix passes                   | PASS   | `npm run test -- src/lib/permission-policy.test.ts` |

Browser-click persona denial tests remain scheduled under `REAL_USER_BROWSER_UAT.md`.
