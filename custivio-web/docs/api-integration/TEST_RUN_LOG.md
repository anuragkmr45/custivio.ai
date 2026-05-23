# Custivio Frontend Test Run Log

Report date: 2026-05-22

## Command Results

| Phase | Command                                                                                                     | Working directory    | Result          | Error summary                                                                                                | Blocks release? | Notes                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------ | --------------- | -------------------------------------------------------------- |
| 0     | `npm install` / `npm ci`                                                                                    | `custivio-web/`      | PASS_WITH_NOTES | Initial sandbox npm invocation failed with npm internal exit-handler issue; `npm ci` passed outside sandbox. | No              | Final `npm ci` passed and npm audit reports 0 vulnerabilities. |
| 1     | `API_OPENAPI_FILE=/private/tmp/custivio-openapi.json npm run generate:api-types`                            | `custivio-web/`      | PASS            | None                                                                                                         | No              | Generated 64 operations.                                       |
| 1     | `npm run check:api-contract`                                                                                | `custivio-web/`      | PASS_WITH_NOTES | One intermediate failure after generated file formatting; checker fixed and rerun passed.                    | No              | Required endpoint groups present.                              |
| 2     | `npm run test`                                                                                              | `custivio-web/`      | PASS            | None                                                                                                         | No              | 4 files and 26 tests passed.                                   |
| 14    | `npm run lint`                                                                                              | `custivio-web/`      | PASS_WITH_NOTES | 6 existing fast-refresh warnings in UI primitive files at that checkpoint.                                   | No              | Final lint run passes after warning cleanup.                   |
| 14    | `npm run typecheck`                                                                                         | `custivio-web/`      | PASS            | None                                                                                                         | No              | TypeScript compile check passed.                               |
| 14    | `npm run build`                                                                                             | `custivio-web/`      | PASS            | None                                                                                                         | No              | Client and SSR builds passed; preview entry generated.         |
| 14    | `npm run format:check`                                                                                      | `custivio-web/`      | PASS_WITH_NOTES | Intermediate run found doc formatting issues before final docs formatting.                                   | No              | Final rerun passed after targeted docs formatting.             |
| 14    | `npm run test:e2e`                                                                                          | `custivio-web/`      | PASS_WITH_NOTES | Sourcing backend `.env` printed a harmless shell warning for one unquoted value; all steps passed.           | No              | 12 full-system steps passed with local API/frontend servers.   |
| 14    | Lower-permission smoke                                                                                      | `custivio/apps/api/` | PASS_WITH_NOTES | Two one-off command composition attempts failed before corrected command passed.                             | No              | UAT auditor received `403 forbidden` for admin mutation.       |
| 2     | `npm run test -- src/lib/permission-policy.test.ts`                                                         | `custivio-web/`      | PASS            | None                                                                                                         | No              | Seven-persona route/action visibility matrix passed.           |
| 3     | `npm run typecheck`                                                                                         | `custivio-web/`      | PASS            | None                                                                                                         | No              | Passed after server-backed asset table changes.                |
| 4     | `npm run test -- src/lib/api/client.test.ts src/lib/api/services.test.ts src/lib/permission-policy.test.ts` | `custivio-web/`      | PASS            | None                                                                                                         | No              | 24 tests passed, including request timeout behavior.           |
| 6     | `npm run test:browser -- --list`                                                                            | `custivio-web/`      | PASS            | None                                                                                                         | No              | Playwright lists 2 browser-click UAT tests.                    |
| 6     | `PLAYWRIGHT_SKIP_WEB_SERVER=1 npm run test:browser`                                                         | `custivio-web/`      | PASS_WITH_NOTES | UAT env/server values absent, so tests skipped.                                                              | No              | Confirms Playwright config/spec loading.                       |
| 7     | `npm audit --audit-level=moderate`                                                                          | `custivio-web/`      | PASS            | None                                                                                                         | No              | 0 vulnerabilities after `npm audit fix`.                       |
| 7     | `npm run lint`                                                                                              | `custivio-web/`      | PASS            | None                                                                                                         | No              | Fast-refresh warnings fixed.                                   |
| 7     | `npm run test`                                                                                              | `custivio-web/`      | PASS            | None                                                                                                         | No              | 4 files and 27 tests passed after Playwright exclusion.        |
| 9     | `npm ci`                                                                                                    | `custivio-web/`      | PASS            | None                                                                                                         | No              | Lockfile install passed; npm reports 0 vulnerabilities.        |
| 9     | `npm run lint`                                                                                              | `custivio-web/`      | PASS            | None                                                                                                         | No              | No lint errors or fast-refresh warnings.                       |
| 9     | `npm run typecheck`                                                                                         | `custivio-web/`      | PASS            | None                                                                                                         | No              | TypeScript compile check passed.                               |
| 9     | `npm run test`                                                                                              | `custivio-web/`      | PASS            | None                                                                                                         | No              | 4 files and 27 tests passed.                                   |
| 9     | `npm run build`                                                                                             | `custivio-web/`      | PASS            | None                                                                                                         | No              | Vite client and SSR builds passed; preview entry generated.    |
| 9     | `npm run check:api-contract`                                                                                | `custivio-web/`      | PASS            | None                                                                                                         | No              | Contract check passed with 64 generated operations.            |
| 9     | `npm audit --audit-level=moderate`                                                                          | `custivio-web/`      | PASS            | None                                                                                                         | No              | Found 0 vulnerabilities.                                       |
| 9     | `E2E_API_BASE_URL=... E2E_FRONTEND_BASE_URL=... npm run test:e2e`                                           | `custivio-web/`      | PASS            | None                                                                                                         | No              | 12 full-system fetch/route groups passed.                      |
| 9     | `E2E_API_BASE_URL=... E2E_ADMIN_EMAIL=... E2E_STORE_EMAIL=... npm run test:browser`                         | `custivio-web/`      | PASS            | None                                                                                                         | No              | 2 Chromium browser-click UAT tests passed.                     |

## E2E Smoke Steps

| Step                                                      | Result |
| --------------------------------------------------------- | ------ |
| Frontend routes respond                                   | PASS   |
| Backend login                                             | PASS   |
| Session restore                                           | PASS   |
| Catalog and locations                                     | PASS   |
| Asset list/search/detail/create                           | PASS   |
| Asset lifecycle and attachment upload/download/delete     | PASS   |
| Stock movement                                            | PASS   |
| Custody checkout/checkin and transfer create              | PASS   |
| Maintenance ticket and warranty                           | PASS   |
| Audit campaign/scan, import/process, export, saved filter | PASS   |
| Ops/health/metrics/OpenAPI                                | PASS   |
| Logout and post-logout 401                                | PASS   |

## Failure Classification

| Failure                                               | Classification   | Resolution                                                                    |
| ----------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| npm sandbox install issue                             | environment-only | `npm ci` passed outside sandbox.                                              |
| API contract checker parsing formatted generated file | safe to fix      | Checker now evaluates the generated local constant and passes.                |
| E2E `.env` shell warning                              | safe to ignore   | Variables needed by the script were loaded and all smoke steps passed.        |
| Fast-refresh warnings                                 | safe to fix      | UI primitive variant/helper exports were moved or removed; final lint passes. |

## Pass/Fail Count

- Passing frontend command groups: 16.
- Passing with notes: 4.
- Unresolved failing command groups: 0.
