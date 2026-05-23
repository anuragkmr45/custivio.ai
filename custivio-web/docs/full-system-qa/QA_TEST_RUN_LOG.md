# QA Test Run Log

Environment: local Docker QA  
Status: `PASS`

## QA Endpoints

| Service          | URL                     |
| ---------------- | ----------------------- |
| API              | `http://localhost:3003` |
| Frontend preview | `http://localhost:8081` |
| Postgres         | `localhost:55432`       |
| Valkey           | `localhost:56379`       |
| MinIO API        | `http://localhost:9100` |
| MinIO console    | `http://localhost:9101` |
| Prometheus       | `http://localhost:9091` |
| Grafana          | `http://localhost:3032` |

## Command Results

| Time       | Repo           | Command/check                                                                                                 | Result | Notes                                                                                                                              |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-17 | custivio       | `docker build -f infra/Dockerfile.api -t custivio-api:qa-local .`                                             | PASS   | Fresh QA runtime image built from current backend source.                                                                          |
| 2026-05-17 | QA Docker      | `docker compose -f /private/tmp/eip-qa-compose.yml up -d postgres valkey minio minio-init prometheus grafana` | PASS   | QA dependencies healthy.                                                                                                           |
| 2026-05-17 | QA Docker      | `docker compose -f /private/tmp/eip-qa-compose.yml run --rm api pnpm db:migrate`                              | PASS   | Passed after fresh image migration rerun.                                                                                          |
| 2026-05-17 | QA Docker      | `docker compose -f /private/tmp/eip-qa-compose.yml run --rm api pnpm db:seed`                                 | PASS   | Baseline seed passed.                                                                                                              |
| 2026-05-17 | QA Docker      | `docker compose -f /private/tmp/eip-qa-compose.yml run --rm api pnpm db:seed:uat`                             | PASS   | UAT users/data seeded after fresh image migration.                                                                                 |
| 2026-05-17 | QA Docker      | `docker compose -f /private/tmp/eip-qa-compose.yml up -d api worker`                                          | PASS   | QA API healthy on `3003`; worker running.                                                                                          |
| 2026-05-17 | custivio       | `API_BASE_URL=http://127.0.0.1:3003 pnpm smoke:api`                                                           | PASS   | Health, readiness, metrics, ops, OpenAPI, and docs passed.                                                                         |
| 2026-05-17 | custivio       | `pnpm check`                                                                                                  | PASS   | Source workspace static gate passed.                                                                                               |
| 2026-05-17 | custivio       | `pnpm build:api`                                                                                              | PASS   | API package built.                                                                                                                 |
| 2026-05-17 | custivio       | `pnpm test:api`                                                                                               | PASS   | 9 files and 25 tests passed.                                                                                                       |
| 2026-05-17 | custivio       | `RUN_DB_TESTS=1 pnpm test` against QA Docker services                                                         | PASS   | 24 files and 82 DB-backed tests passed with QA Postgres/Valkey/MinIO.                                                              |
| 2026-05-17 | custivio-web   | `VITE_API_BASE_URL=http://localhost:3003 npm run typecheck`                                                   | PASS   | TypeScript passed.                                                                                                                 |
| 2026-05-17 | custivio-web   | `VITE_API_BASE_URL=http://localhost:3003 npm run lint`                                                        | PASS   | Passed with existing non-blocking fast-refresh warnings in UI primitives.                                                          |
| 2026-05-17 | custivio-web   | `VITE_API_BASE_URL=http://localhost:3003 npm run test`                                                        | PASS   | 3 files and 21 tests passed.                                                                                                       |
| 2026-05-17 | custivio-web   | `VITE_API_BASE_URL=http://localhost:3003 npm run build`                                                       | PASS   | Build passed; postbuild created `dist/server/server.js`; Wrangler logging warned about local preferences permissions but exited 0. |
| 2026-05-17 | custivio-web   | `npm run preview -- --host 0.0.0.0 --port 8081`                                                               | PASS   | Preview served after `QA-FE-001` fix.                                                                                              |
| 2026-05-17 | custivio-web   | `E2E_API_BASE_URL=http://127.0.0.1:3003 E2E_FRONTEND_BASE_URL=http://127.0.0.1:8081 npm run test:e2e`         | PASS   | 12/12 E2E smoke flows passed.                                                                                                      |
| 2026-05-17 | Browser QA     | Admin login/dashboard/mobile/console                                                                          | PASS   | Browser login succeeded; dashboard rendered; mobile viewport rendered; console after login had 0 errors/warnings.                  |
| 2026-05-17 | API persona QA | Manager/store/auditor permission check                                                                        | PASS   | All three users logged in; admin users endpoint returned `403`.                                                                    |

## Notable Retests

| Defect     | Initial result                                | Fix/decision                                                             | Retest               |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------ | -------------------- |
| QA-ENV-001 | Stale runtime image missed `db:seed:uat`.     | Built fresh `custivio-api:qa-local`.                                     | PASS                 |
| QA-ENV-002 | Seed failed after stale-image migration.      | Reran migrations using fresh image.                                      | PASS                 |
| QA-ENV-003 | Runtime image could not run lint/static gate. | Run static gates from source; runtime image is tested through smoke/E2E. | PASS / ACCEPTED_RISK |
| QA-ENV-004 | Sandbox/CORS command setup blocked DB tests.  | Reran with approved network access and both local frontend origins.      | PASS                 |
| QA-FE-001  | Preview served `500` for frontend routes.     | Added `postbuild` preview-entry compatibility script.                    | PASS                 |

## Evidence

| Matrix ID                     | Result | Evidence                                                                                                           |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| QA-API-001 through QA-API-090 | PASS   | Smoke, DB-backed backend tests, E2E, browser login, and persona API checks passed against `http://localhost:3003`. |
| QA-UI-001 through QA-UI-090   | PASS   | Frontend typecheck/lint/test/build/E2E and manual browser checks passed against `http://localhost:8081`.           |
