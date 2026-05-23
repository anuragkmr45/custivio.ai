# Custivio Product UAT Report

Report date: 2026-05-22

Product UAT result: READY FOR REAL USER UAT

| Module                 | UAT status      | Evidence                                                                            | Remaining risk                                                  |
| ---------------------- | --------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| App shell and auth     | PASS            | Login/session/logout smoke passed; browser admin login passed.                      | Browser logout click expansion is P2.                           |
| Permissions/navigation | PASS            | Seven-persona policy tests passed; lower-permission browser denial passed.          | Manual persona-by-persona sweep recommended before production.  |
| Dashboard              | PASS            | Frontend route smoke and real API-backed modules build successfully.                | Backend pagination remains future hardening.                    |
| Admin users            | PASS            | Admin APIs and frontend build/typecheck pass; backend DB tests pass.                | Manual reset-password copy review.                              |
| Roles                  | PASS            | Role permission checkbox editor implemented and build/typecheck pass.               | Preserve unknown keys behavior should be included in manual QA. |
| Assignments            | PASS            | Existing assignment API/UI retained and validation passes.                          | Scope selector can improve further.                             |
| Catalog                | PASS            | Catalog API e2e read passed; edit dialogs replace prompt flow.                      | Manual conflict/in-use checks recommended.                      |
| Locations              | PASS            | Location API e2e read passed; edit dialog replaces prompt flow.                     | Deep hierarchy UX can improve later.                            |
| Assets                 | PASS            | Asset search/create/detail smoke passed; browser asset create/detail passed.        | Browser QA for every custom field type can expand later.        |
| Attachments            | PASS            | Browser upload/download/delete passed; soft-deleted attachments hidden from detail. | True upload percentage is future.                               |
| Stock                  | PASS            | Stock movement e2e passed; DB idempotency tests pass.                               | Table pagination hardening can follow.                          |
| Custody                | PASS            | Checkout/checkin e2e passed; explicit handover UI implemented.                      | Browser QA for same-user handover rejection.                    |
| Transfers              | PASS_WITH_NOTES | Transfer create e2e passed; decision behavior is covered by backend tests.          | Browser QA for approve/reject.                                  |
| Maintenance            | PASS            | Ticket/status e2e passed.                                                           | None blocking.                                                  |
| Warranty               | PASS            | Warranty e2e passed.                                                                | None blocking.                                                  |
| Audits                 | PASS            | Campaign/scan e2e passed.                                                           | None blocking.                                                  |
| Imports                | PASS            | Import preview/process e2e passed; CSV/JSON UI implemented.                         | Manual malformed-file QA recommended.                           |
| Reports/exports        | PASS_WITH_NOTES | Export job and saved filter e2e passed; blob download UI wired.                     | Browser QA for completed export download.                       |
| Worker/job status      | PASS            | Import/export job lists render and build passes.                                    | Polling interval tuning can follow.                             |
| Ops/health             | PASS            | Live/ready/ops/metrics/OpenAPI e2e step passed.                                     | Restrict exposure at reverse proxy in production.               |
| Proxmox/on-prem        | PASS            | `deploy/proxmox/scripts/validate-all.sh` and production Compose validation passed.  | Staging install still required on target hardware.              |
| Cloud showcase         | PASS            | Docs/env examples created.                                                          | Needs provider account/domain execution.                        |

## Summary

Custivio is ready for real user UAT using real backend data. The core inventory, asset, stock, custody, transfer, maintenance, warranty, audit, import, export, status, and admin flows are integrated enough for UAT. Remaining risks are P2 hardening and broader manual/browser persona walkthrough items, not P0/P1 blockers.
