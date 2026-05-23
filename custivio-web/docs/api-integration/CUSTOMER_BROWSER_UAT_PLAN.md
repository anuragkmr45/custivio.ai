# Custivio Customer Browser UAT Plan

Report date: 2026-05-23

## Objective

Prove customer-critical workflows with browser-click Playwright coverage using real backend UAT data. Fetch/route smoke remains useful API smoke, but it is not sufficient for customer release candidate readiness.

## Required Browser Coverage

| Area | Browser action | Status | Notes |
| --- | --- | --- | --- |
| Auth | Login/logout/session checks | NOT_STARTED | Cover admin and lower-permission user. |
| Admin users | Create/edit/disable/reset password | NOT_STARTED | Use isolated UAT-created test users. |
| Roles/assignments | Create/edit role and assign/remove | NOT_STARTED | Preserve existing roles. |
| Catalog | Create category/type/custom field/manufacturer/model/vendor | NOT_STARTED | Use unique Playwright keys. |
| Locations | Create/edit/archive hierarchy resources | NOT_STARTED | Use unique Playwright names. |
| Assets | Create/edit/detail/search | NOT_STARTED | Avoid hardcoded UAT UUIDs. |
| Attachments | Upload/download/delete | NOT_STARTED | Use small text fixture. |
| Stock | Receive/issue/transfer/adjust | NOT_STARTED | Use seeded or browser-created stock item. |
| Custody/transfers | Checkout/checkin/handover and approve/reject | NOT_STARTED | Use explicit target user. |
| Maintenance/warranty | Ticket create/status and warranty create/list | NOT_STARTED | Use real asset IDs from UI choices. |
| Audits/imports/exports | Campaign/scan/import/process/export/download/saved filter | NOT_STARTED | Use CSV/JSON inputs and blob download. |
| Permissions | Forbidden admin access for lower-permission user | NOT_STARTED | Validate browser UX and backend denial where practical. |

