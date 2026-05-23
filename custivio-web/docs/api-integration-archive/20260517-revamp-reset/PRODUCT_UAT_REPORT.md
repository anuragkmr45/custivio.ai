# Product UAT Report

Report date: 2026-05-17

## Summary

The frontend is now usable against the real Fastify backend and UAT seed data for the primary inventory workflows. The application can enter full product QA with repeatable E2E smoke coverage, toast-style mutation feedback, and visible controls for the main create/update/status/decision/download flows. Final production UI signoff should still include visual polish and post-QA mock cleanup, but no API integration blocker remains.

| Module                        | UAT status        | Issues                                                         | Fix applied                                                                                             | Remaining risk                                                           |
| ----------------------------- | ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Login/session                 | Passed            | Previous mock localStorage auth did not match backend cookies. | Integrated backend login/logout/me with `credentials: "include"`.                                       | None blocking.                                                           |
| App shell/navigation          | Passed            | Permission keys differed from mock names.                      | Navigation now reads backend `permissionKeys`.                                                          | Frontend hiding is UX-only; backend remains authoritative.               |
| Admin users/roles/assignments | Passed            | Advanced forms were previously missing.                        | Users, roles, assignments, create, update, reset password, disable, assign and remove are wired.        | Admin advanced actions can still receive UI copy polish.                 |
| Catalog/location hierarchy    | Passed            | Update controls were previously missing.                       | Lists, archive, create and update controls are wired for catalog and location hierarchy.                | Parent dependency mistakes can still be made by user selection.          |
| Asset registry                | Passed            | Edit and lifecycle-event forms were previously missing.        | List, search, detail, create, update, lifecycle and attachment flows are wired.                         | Lifecycle copy and richer validation can be polished during QA.          |
| Asset attachments             | Passed            | Must avoid direct MinIO browser access.                        | Upload, authorized download and delete use backend API routes.                                          | Browser smoke did not upload a large real file.                          |
| Stock/inventory               | Passed with notes | Movement UX is generic.                                        | Unit/item create and movement submit use backend APIs and idempotency keys.                             | More guided receive/issue/transfer/adjust forms would improve usability. |
| Custody/transfers             | Passed with notes | Transfer/custody forms are basic.                              | Checkout, check-in, handover, transfer request, approve and reject are wired.                           | Manager-oriented workflow copy can be improved.                          |
| Maintenance/warranty          | Passed with notes | Rich asset drill-down is not implemented.                      | Ticket create/status and warranty create/list are wired.                                                | Better asset context on warranty rows would help QA.                     |
| Audit/import/export/reporting | Passed with notes | Job polling is simple and no dedicated detail view exists.     | Campaign, scan, import preview/process, export create/download, saved filters and job status are wired. | Dead-letter/error job detail UX can be richer.                           |
| Dashboard/status              | Passed            | Dashboard was mock-derived.                                    | Dashboard derives summaries from live list APIs; status page uses health/ready/ops/metrics/OpenAPI.     | Metrics parsing is intentionally lightweight.                            |
| Product usability             | Passed            | Success feedback was previously implicit through data refresh. | Global mutation success/error toasts, loading/error states and route-level panels exist.                | Fine-tune message copy during product QA.                                |

## QA Entry Decision

The integrated frontend is ready for full product QA against UAT backend data. QA can validate real login, permissions, inventory data, file uploads/downloads, job status, route navigation, mutation success feedback, and logout/401 behavior now. Remaining issues are frontend polish and cleanup items, not backend or API integration blockers.
