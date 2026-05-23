# Custivio Real User Browser UAT

Report date: 2026-05-22

## Current Status

Browser/product QA readiness: READY_WITH_NOTES

The previous `npm run test:e2e` command is still classified as fetch/route smoke, not full user QA. Playwright browser-click coverage now exists in `tests/browser/real-user-uat.spec.ts` and was run against local backend/frontend services with real UAT credentials.

## Required Browser Flows

| Flow                        | Status          | Evidence                                                       | Notes                                                                                                                         |
| --------------------------- | --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Admin login and dashboard   | PASS            | `tests/browser/real-user-uat.spec.ts`                          | Real UAT admin login and dashboard load passed.                                                                               |
| Master data setup           | PASS_WITH_NOTES | Backend DB/API tests and UI route validation                   | Seeded master-data-backed forms are browser-validated; exhaustive browser creation of every master-data type is P2 expansion. |
| Asset workflow              | PASS            | `tests/browser/real-user-uat.spec.ts`                          | Search UAT asset, create asset, open detail, upload/download/delete attachment passed.                                        |
| Stock workflow              | PASS_WITH_NOTES | `npm run test:e2e`, backend DB tests, browser route validation | Stock movement is covered by API smoke and DB tests; browser spec verifies stock UI route availability.                       |
| Custody/transfer workflow   | PASS_WITH_NOTES | `npm run test:e2e`, backend DB tests, browser route validation | Checkout/checkin/transfer API smoke and backend tests pass; browser spec verifies custody UI route availability.              |
| Maintenance/warranty        | PASS_WITH_NOTES | `npm run test:e2e`, backend DB tests, browser route validation | Ticket/warranty API smoke and backend tests pass; browser spec verifies maintenance UI route availability.                    |
| Audit/import/export         | PASS_WITH_NOTES | `npm run test:e2e`, backend DB tests, browser route validation | Campaign/scan/import/export API smoke and backend tests pass; browser spec verifies Audit & Reports UI route availability.    |
| Lower-permission denial     | PASS            | `tests/browser/real-user-uat.spec.ts`                          | Store user received access denied for admin users page.                                                                       |
| Logout and post-logout auth | PASS_WITH_NOTES | `npm run test:e2e`                                             | Fetch/route smoke validates logout and post-logout 401; browser logout click remains P2 expansion.                            |

## Commands

| Command                                                                                                                                                            | Result          | Notes                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------- |
| `npm run test:browser -- --list`                                                                                                                                   | PASS            | Lists two Chromium browser-click UAT tests.                                        |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1 npm run test:browser`                                                                                                                | PASS_WITH_NOTES | Tests skipped because UAT env/server values were intentionally absent in this run. |
| `E2E_API_BASE_URL=http://127.0.0.1:3002 E2E_ADMIN_EMAIL=admin.uat@inventory.local E2E_STORE_EMAIL=store.uat@inventory.local E2E_PASSWORD=... npm run test:browser` | PASS            | 2 Chromium browser-click UAT tests passed against local backend/frontend services. |

## Required Environment For Full Browser Run

- Backend seeded with `pnpm db:seed` and `pnpm db:seed:uat`.
- Frontend API URL: `E2E_API_BASE_URL=http://127.0.0.1:3002`.
- Browser credentials: `E2E_ADMIN_EMAIL`, `E2E_STORE_EMAIL` or `E2E_AUDITOR_EMAIL` or `E2E_VIEWER_EMAIL`, and `E2E_PASSWORD`.
