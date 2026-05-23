# Custivio Customer Browser UAT Report

Report date: 2026-05-23

Browser-click QA readiness: READY

## Results

| Area                        | Status | Evidence                                     | Notes                                                                                  |
| --------------------------- | ------ | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| Auth/session                | PASS   | `tests/browser/customer-release-uat.spec.ts` | Login, logout, and 401 redirect covered.                                               |
| Admin users                 | PASS   | `tests/browser/customer-release-uat.spec.ts` | Create, edit, disable, reset password.                                                 |
| Roles/assignments           | PASS   | `tests/browser/customer-release-uat.spec.ts` | Create, edit, assign, remove.                                                          |
| Catalog                     | PASS   | `tests/browser/customer-release-uat.spec.ts` | Category, type, custom field, manufacturer, model, vendor create; vendor edit/archive. |
| Locations                   | PASS   | `tests/browser/customer-release-uat.spec.ts` | Site/building create; building edit/archive.                                           |
| Assets                      | PASS   | `tests/browser/customer-release-uat.spec.ts` | Create, edit, detail, search, lifecycle event.                                         |
| Attachments                 | PASS   | `tests/browser/customer-release-uat.spec.ts` | Upload, download, delete.                                                              |
| Stock                       | PASS   | `tests/browser/customer-release-uat.spec.ts` | Unit/item create and receive, issue, transfer, adjust movements.                       |
| Custody/transfers           | PASS   | `tests/browser/customer-release-uat.spec.ts` | Checkout, explicit handover, checkin, transfer approve/reject.                         |
| Maintenance/warranty        | PASS   | `tests/browser/customer-release-uat.spec.ts` | Ticket create/start/resolve and warranty create/list.                                  |
| Audit/import/export/reports | PASS   | `tests/browser/customer-release-uat.spec.ts` | Campaign, scan, import preview/process, saved filter, export/download.                 |
| Permission denial           | PASS   | `tests/browser/customer-release-uat.spec.ts` | Seven personas include forbidden pages and backend mutation denial.                    |

## Commands

| Command                                                              | Result | Notes                                                                    |
| -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `npm run test:browser -- --list`                                     | PASS   | Registered 10 browser tests across real-user and customer-release specs. |
| `npm run test:browser -- tests/browser/customer-release-uat.spec.ts` | PASS   | 8 passed in 2.1 minutes against local backend/frontend and UAT seed.     |
| `npm run test:browser`                                               | PASS   | Full suite passed: 10 browser-click tests in 2.2 minutes.                |

## Product Bugs Found And Fixed

| Bug                                                                                                  | Fix                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Optional custom fields were treated as required because `"false"` string values were coerced truthy. | `src/routes/_authenticated/assets.index.tsx` now checks `String(field.required) === "true"`.                |
| Asset edit dialog could extend outside the viewport, making Save inaccessible.                       | `src/routes/_authenticated/assets.$assetId.tsx` now uses max-height, overflow scrolling, and sticky footer. |
| Handover history rows appeared as active custody rows because only `checked_in` was excluded.        | `src/routes/_authenticated/custody.tsx` now shows only `status === "active"` in Active custody.             |
| Browser logout test clicked a page-header action instead of the top-bar user menu.                   | Browser UAT helper now targets the user menu by accessible permissions label.                               |

## Remaining P2 Notes

- Exact upload progress percentage is intentionally not implemented; the current fetch path shows file selected, file size, uploading state, success/failure, and retry path.
- Cloud/provider deployment execution remains outside this local browser UAT.
