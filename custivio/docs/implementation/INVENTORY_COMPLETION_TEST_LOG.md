# Custivio Inventory Completion Test Log

Report date: 2026-05-22

## Command Results

| Phase | Command                                                                          | Working directory       | Result          | Error summary                                                                                                   | Blocks release? | Notes                                                                                          |
| ----- | -------------------------------------------------------------------------------- | ----------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| 0     | `pnpm install`                                                                   | `custivio/`             | PASS            | None                                                                                                            | No              | Dependencies restored from cache; pnpm warned about ignored build scripts.                     |
| 0     | `npm ci`                                                                         | `custivio-web/`         | PASS_WITH_NOTES | Initial sandbox npm install failed with npm internal exit-handler issue; rerun outside sandbox passed.          | No              | npm audit reports 10 moderate vulnerabilities.                                                 |
| 0     | `bash scripts/validate-config.sh`                                                | `shared-observability/` | PASS            | None                                                                                                            | No              | Shared observability config validates.                                                         |
| 1     | `API_OPENAPI_FILE=/private/tmp/custivio-openapi.json npm run generate:api-types` | `custivio-web/`         | PASS            | None                                                                                                            | No              | Generated 64 OpenAPI operations.                                                               |
| 1     | `npm run check:api-contract`                                                     | `custivio-web/`         | PASS_WITH_NOTES | One intermediate run failed after Prettier changed generated object formatting; checker fixed and rerun passed. | No              | Required endpoint groups present.                                                              |
| 4     | `pnpm build:api`                                                                 | `custivio/`             | PASS            | None                                                                                                            | No              | Fastify API TypeScript build passed.                                                           |
| 4     | `pnpm test:api`                                                                  | `custivio/`             | PASS            | None                                                                                                            | No              | 9 API test files, 37 tests passed.                                                             |
| 4     | `pnpm check:forbidden`                                                           | `custivio/`             | PASS            | None                                                                                                            | No              | Forbidden dependency check passed.                                                             |
| 4     | `pnpm check`                                                                     | `custivio/`             | PASS            | None                                                                                                            | No              | Typecheck, lint, format check, non-DB tests, and forbidden dependency check passed.            |
| 4     | `RUN_DB_TESTS=1 pnpm test`                                                       | `custivio/`             | PASS            | Sandbox cannot connect to local Docker services; rerun outside sandbox passed.                                  | No              | 24 files, 95 tests passed.                                                                     |
| 4     | Lower-permission UAT smoke                                                       | `custivio/apps/api/`    | PASS_WITH_NOTES | Two command-composition attempts failed; corrected app-injection command passed.                                | No              | UAT auditor login succeeded and admin user mutation returned `403 forbidden`.                  |
| 14    | `pnpm db:generate`                                                               | `custivio/`             | PASS            | None                                                                                                            | No              | Drizzle reported 47 tables and no schema changes.                                              |
| 14    | `pnpm db:migrate`                                                                | `custivio/`             | PASS_WITH_NOTES | Sandbox `tsx` IPC pipe denied; rerun outside sandbox passed.                                                    | No              | No migration output indicates database was current.                                            |
| 14    | `pnpm db:seed`                                                                   | `custivio/`             | PASS            | None                                                                                                            | No              | Local dev seed completed.                                                                      |
| 14    | `pnpm db:seed:uat`                                                               | `custivio/`             | PASS            | None                                                                                                            | No              | UAT seed completed.                                                                            |
| 14    | `bash scripts/validate-prod-compose.sh`                                          | `custivio/`             | PASS            | None                                                                                                            | No              | Production Compose config valid with validation env.                                           |
| 14    | `bash deploy/proxmox/scripts/validate-all.sh`                                    | `custivio/`             | PASS            | None                                                                                                            | No              | App LXC, data VM, release bundle, firewall/operator docs, and observability validation passed. |
| 14    | `pnpm format:check`                                                              | `custivio/`             | PASS            | None                                                                                                            | No              | Backend repo formatting passed after targeted docs formatting.                                 |

## Result Values

- `PASS`
- `PASS_WITH_NOTES`
- `FAIL`
- `NOT_RUN`
- `IN_PROGRESS`

## Failure Classification

| Failure                                               | Classification   | Resolution                                                 |
| ----------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| npm install/npm ci sandbox failure                    | environment-only | `npm ci` passed outside sandbox.                           |
| `pnpm db:migrate` sandbox `tsx` IPC failure           | environment-only | Rerun outside sandbox passed.                              |
| DB-backed tests need local Docker DB/Valkey           | environment-only | Rerun outside sandbox passed.                              |
| OpenAPI contract check after Prettier formatting      | safe to fix      | Checker now evaluates generated local constant and passes. |
| Permission smoke top-level await/app-builder mistakes | safe to fix      | Corrected command passed with `403 forbidden`.             |

## Pass/Fail Count

- Passing backend/deployment/shared command groups: 15.
- Passing with notes: 5.
- Unresolved failing command groups: 0.
