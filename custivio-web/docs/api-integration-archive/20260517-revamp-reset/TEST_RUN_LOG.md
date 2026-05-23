# Test Run Log

## 2026-05-17 Baseline

### Frontend (`custivio-web`)

| Command             | Result          | Notes                                                                                                                             |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `bun --version`     | PASS            | Bun `1.3.5`; `bun.lock` is present, so Bun is treated as the current frontend package manager.                                    |
| `bun install`       | PASS_WITH_NOTES | First sandboxed run failed with tempdir permission denial. Escalated run passed and installed 493 packages.                       |
| `bun run lint`      | FAIL            | Existing code has 402 Prettier lint errors and 6 Fast Refresh warnings. This predates API integration.                            |
| `bun run typecheck` | FAIL            | Script missing from `package.json`.                                                                                               |
| `bun run test`      | FAIL            | Script missing from `package.json`; shell found `/bin/test` because no package script exists.                                     |
| `bunx tsc --noEmit` | FAIL            | Type error in `src/components/app-shell/TopBar.tsx`: navigation to `/login` is missing required `search` params.                  |
| `bun run build`     | PASS_WITH_NOTES | Build completed successfully. Wrangler logged an EPERM writing to `~/Library/Preferences/.wrangler/logs`, but process exited `0`. |

### Backend (`custivio`)

| Command                                             | Result          | Notes                                                                                                      |
| --------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm docker:dev`                                   | PASS_WITH_NOTES | First sandboxed run could not access Docker socket. Escalated run passed and services started.             |
| `docker compose -f infra/docker-compose.dev.yml ps` | PASS            | Postgres, Valkey, MinIO, Mailpit, OTel, Prometheus, and Grafana are running; core data services healthy.   |
| `pnpm db:migrate`                                   | PASS_WITH_NOTES | First sandboxed run failed because `tsx` could not open an IPC pipe. Escalated run passed.                 |
| `pnpm db:seed`                                      | PASS_WITH_NOTES | Escalated run passed.                                                                                      |
| `pnpm db:seed:uat`                                  | PASS_WITH_NOTES | Escalated run passed.                                                                                      |
| `pnpm check`                                        | PASS            | Typecheck, lint, format, non-DB tests, and forbidden dependency check passed.                              |
| `pnpm build:api`                                    | PASS            | Fastify API TypeScript build passed.                                                                       |
| `pnpm test:api`                                     | PASS            | 9 API test files and 24 tests passed.                                                                      |
| `RUN_DB_TESTS=1 pnpm test`                          | PASS_WITH_NOTES | First sandboxed run failed with local Postgres connection EPERM. Escalated run passed: 24 files, 80 tests. |

### Baseline Conclusion

Backend is ready for frontend integration. Frontend requires local quality gate repair before API integration can be considered complete: add `typecheck` and `test` scripts, fix existing formatting, and fix the `TopBar` typed navigation error.

## 2026-05-17 Central API Client Gate

| Command                | Result          | Notes                                                                                    |
| ---------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `bun add -d vitest`    | PASS            | Added Vitest as the frontend test runner.                                                |
| `bun run format`       | PASS            | Formatted existing frontend files and new integration docs/client files.                 |
| `bun run test`         | PASS            | 1 test file, 13 API client tests passed.                                                 |
| `bun run typecheck`    | PASS            | TypeScript check passed after adding scripts and fixing baseline navigation/test typing. |
| `bun run lint`         | PASS_WITH_NOTES | 0 errors; 6 existing Fast Refresh warnings remain in shadcn-style UI primitives.         |
| `bun run format:check` | PASS            | Prettier check passed.                                                                   |

## 2026-05-17 Auth And Session Gate

| Command / check                                               | Result          | Notes                                                                                   |
| ------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| `bun run test`                                                | PASS            | 2 test files and 15 tests passed after auth/session integration.                        |
| `bun run typecheck`                                           | PASS            | TypeScript check passed.                                                                |
| `bun run lint`                                                | PASS_WITH_NOTES | 0 errors; same 6 Fast Refresh warnings remain in UI primitive files.                    |
| `bun run build`                                               | PASS_WITH_NOTES | Build completed; Wrangler again logged non-fatal EPERM writing to user preference logs. |
| `API_PORT=3004 APP_BASE_URL=http://localhost:3004 pnpm start` | PASS            | Backend API started for UAT auth smoke testing.                                         |
| `POST /api/auth/login`                                        | PASS            | UAT admin login returned HTTP 200 and set `custivio_session`.                           |
| `GET /api/auth/me` with session                               | PASS            | Returned HTTP 200 with tenant, user, permissions, and expiry.                           |
| `POST /api/auth/logout`                                       | PASS            | Returned HTTP 200.                                                                      |
| `GET /api/auth/me` after logout                               | PASS            | Returned expected HTTP 401.                                                             |
| Real response shape sampling                                  | PASS            | Sampled admin, catalog, locations, assets, stock, custody, maintenance, reporting APIs. |

## 2026-05-17 Business Module API Integration

| Command / check                                                                                                                | Result          | Notes                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bun run format`                                                                                                               | PASS            | Formatted API integration docs and route changes.                                                                                                                  |
| `bun run typecheck`                                                                                                            | PASS            | TypeScript check passed after admin, catalog, location, asset, stock, custody, maintenance, reporting, and status integration.                                     |
| `bun run test`                                                                                                                 | PASS            | 3 test files and 20 tests passed: API client, service endpoint mapping, auth/session helpers.                                                                      |
| `bun run lint`                                                                                                                 | PASS_WITH_NOTES | 0 errors; 6 existing Fast Refresh warnings remain in shadcn-style UI primitive files.                                                                              |
| `bun run format:check`                                                                                                         | PASS            | Prettier check passed.                                                                                                                                             |
| `bun run build`                                                                                                                | PASS_WITH_NOTES | Client and SSR builds completed. Wrangler emitted a non-fatal EPERM writing debug logs to user preferences.                                                        |
| `API_PORT=3004 APP_BASE_URL=http://127.0.0.1:3004 CORS_ALLOWED_ORIGINS=http://127.0.0.1:5177,http://localhost:5177 pnpm start` | PASS            | Fastify API started for browser smoke with explicit frontend origins.                                                                                              |
| `VITE_API_BASE_URL=http://127.0.0.1:3004 bun run dev -- --host 127.0.0.1 --port 5177`                                          | PASS            | Vite/TanStack frontend dev server started for browser smoke.                                                                                                       |
| Browser login as `UAT_ADMIN_EMAIL`                                                                                             | PASS            | Login returned 200 and authenticated shell rendered `Welcome back, UAT`.                                                                                           |
| Browser route smoke                                                                                                            | PASS            | `/`, `/assets`, `/catalog`, `/stock`, `/custody`, `/maintenance`, `/audit-reports`, `/status`, `/users`, `/roles`, `/assignments` loaded with no app error panels. |
| Browser permission smoke with `UAT_STORE_EMAIL`                                                                                | PASS            | Store user login succeeded; admin routes showed expected permission-denied/403 behavior without app crash.                                                         |

## 2026-05-17 Completion And E2E Gate

| Command / check                                                                                                                | Result          | Notes                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend browser FormData upload smoke                                                                                          | FAIL            | Real browser `FormData` upload to `/api/assets/:id/attachments` returned `400 body must be object`; this proved a backend contract mismatch.                                            |
| Backend multipart contract fix                                                                                                 | PASS            | Updated `../custivio/apps/api/src/routes/assets.routes.ts` so the multipart parser handles upload body validation for that route.                                                       |
| Backend multipart regression test                                                                                              | PASS            | Added `../custivio/apps/api/src/tests/storage-routes.test.ts` coverage that multipart upload reaches auth (`401`) instead of schema `400`.                                              |
| `pnpm test:api`                                                                                                                | PASS            | Backend API suite passed: 9 files and 25 tests.                                                                                                                                         |
| `API_PORT=3004 APP_BASE_URL=http://127.0.0.1:3004 CORS_ALLOWED_ORIGINS=http://127.0.0.1:5177,http://localhost:5177 pnpm start` | PASS            | Restarted patched Fastify API for full-system smoke.                                                                                                                                    |
| `bun run test:e2e`                                                                                                             | PASS            | Repeatable full-system smoke passed across login, session, catalog, locations, assets, attachment upload/download, stock, custody, maintenance, audit/import/export, status and logout. |
| `pnpm build:api`                                                                                                               | PASS            | Backend API TypeScript build passed.                                                                                                                                                    |
| `pnpm check`                                                                                                                   | PASS            | Backend typecheck, lint, format, non-DB tests and forbidden dependency check passed.                                                                                                    |
| `RUN_DB_TESTS=1 pnpm test`                                                                                                     | FAIL_THEN_PASS  | Sandboxed run failed with local PostgreSQL `EPERM`; escalated rerun passed: 24 files and 81 tests.                                                                                      |
| `bun run format:check`                                                                                                         | PASS            | Frontend Prettier check passed.                                                                                                                                                         |
| `bun run typecheck`                                                                                                            | PASS            | Frontend TypeScript check passed.                                                                                                                                                       |
| `bun run test`                                                                                                                 | PASS            | Frontend unit/service suite passed: 3 files and 20 tests.                                                                                                                               |
| `bun run lint`                                                                                                                 | PASS_WITH_NOTES | 0 errors; 6 existing Fast Refresh warnings remain in UI primitive files.                                                                                                                |
| `bun run build`                                                                                                                | PASS_WITH_NOTES | Client and SSR builds passed; Wrangler emitted the known non-fatal EPERM while writing debug logs under user preferences.                                                               |
| Final `bun run test:e2e`                                                                                                       | PASS            | Final full-system smoke passed again after all gates.                                                                                                                                   |
