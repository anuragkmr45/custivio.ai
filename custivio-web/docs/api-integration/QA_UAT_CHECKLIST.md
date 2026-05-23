# Custivio QA UAT Checklist

Report date: 2026-05-22

| Flow                             | Status          | Evidence                                             | Notes                                                                                                   |
| -------------------------------- | --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Admin login                      | PASS            | `backend login` e2e step and Playwright browser UAT  | Uses backend UAT admin credentials from `.env`.                                                         |
| Current session                  | PASS            | `session restore` e2e step                           | Session returned 19 permission keys.                                                                    |
| Dashboard/protected routes       | PASS            | `frontend routes respond` e2e step and browser UAT   | 11 protected route responses were reachable through the app shell.                                      |
| Catalog list                     | PASS            | `catalog and locations` e2e step                     | Catalog types returned.                                                                                 |
| Locations list                   | PASS            | `catalog and locations` e2e step                     | Sites returned.                                                                                         |
| Search `UAT-LAP-001`             | PASS            | E2E smoke and Playwright browser UAT                 | Seeded asset found.                                                                                     |
| Create asset                     | PASS            | E2E smoke and Playwright browser UAT                 | Unique E2E/browser assets created.                                                                      |
| Asset detail                     | PASS            | E2E smoke and Playwright browser UAT                 | Created asset detail matched.                                                                           |
| Asset edit fields                | PASS_WITH_NOTES | Typecheck/build and DB asset tests                   | UI supports backend-supported full fields; manual browser review recommended for custom field variants. |
| Attachment upload                | PASS            | E2E smoke and Playwright browser UAT                 | Multipart backend upload passed and browser upload UI passed.                                           |
| Attachment download              | PASS            | E2E smoke and Playwright browser UAT                 | Authorized backend blob route and browser download passed.                                              |
| Attachment delete                | PASS            | E2E smoke and Playwright browser UAT                 | Delete route passed and browser detail no longer shows deleted attachment.                              |
| Lifecycle event                  | PASS            | `asset lifecycle and attachment` e2e step            | Lifecycle event created.                                                                                |
| Stock movement                   | PASS            | `stock movement` e2e step                            | Receive movement created.                                                                               |
| Idempotency behavior             | PASS_WITH_NOTES | Backend DB tests and frontend idempotency keys       | Backend conflict/replay tests pass; frontend sends keys for stock/import/export.                        |
| Custody checkout/checkin         | PASS            | `custody and transfers` e2e step                     | Assignment created and checked in.                                                                      |
| Custody handover explicit target | PASS_WITH_NOTES | UI implementation, typecheck/build, backend DB tests | UI requires selected `toUserId`; broader browser mutation coverage is P2.                               |
| Transfer create                  | PASS            | `custody and transfers` e2e step                     | Transfer created.                                                                                       |
| Transfer decision                | PASS_WITH_NOTES | Backend DB tests                                     | API tests cover decision behavior; current e2e creates transfer only.                                   |
| Maintenance ticket               | PASS            | `maintenance and warranty` e2e step                  | Ticket created and status updated.                                                                      |
| Warranty create                  | PASS            | `maintenance and warranty` e2e step                  | Warranty created.                                                                                       |
| Audit campaign and scan          | PASS            | `audit import export reports` e2e step               | Campaign and scan created.                                                                              |
| Import job and process           | PASS            | `audit import export reports` e2e step               | Preview job created and processed.                                                                      |
| Export job and download          | PASS_WITH_NOTES | E2E export creation, build, and API service coverage | Export job created; download UI is wired to blob API.                                                   |
| Saved filter                     | PASS            | `audit import export reports` e2e step               | Saved filter created.                                                                                   |
| Ops/health/metrics/OpenAPI       | PASS            | `ops health metrics openapi` e2e step                | 44 OpenAPI paths observed.                                                                              |
| Logout                           | PASS            | `logout and 401` e2e step                            | Session cleared.                                                                                        |
| 401 after logout                 | PASS            | `logout and 401` e2e step                            | `/api/auth/me` returned 401.                                                                            |
| Lower-permission 403             | PASS            | UAT auditor API smoke and Playwright browser UAT     | Lower-permission user sees admin access denied in browser and backend denies unauthorized mutation.     |

## UAT Users

- `UAT_ADMIN_EMAIL`
- `UAT_MANAGER_EMAIL`
- `UAT_STORE_EMAIL`
- `UAT_TECHNICIAN_EMAIL`
- `UAT_APPROVER_EMAIL`
- `UAT_AUDITOR_EMAIL`
- `UAT_VIEWER_EMAIL`

All use the local-only UAT password from the backend `.env`.
