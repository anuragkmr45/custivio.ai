# Custivio Customer Release Test Log

Report date: 2026-05-23

## Command Results

| Phase | Command                                                                              | Working directory                               | Result | Error summary                                                                  | Blocks release? | Notes                                                                   |
| ----- | ------------------------------------------------------------------------------------ | ----------------------------------------------- | ------ | ------------------------------------------------------------------------------ | --------------- | ----------------------------------------------------------------------- |
| 0     | Control docs review                                                                  | `/Users/anuragkumar/Desktop/inventory-research` | PASS   | None                                                                           | No              | Customer-release docs were created before code/test edits.              |
| 2     | `npm run test:browser -- --list`                                                     | `custivio-web`                                  | PASS   | None                                                                           | No              | 10 browser tests registered.                                            |
| 2     | `npm run test:browser -- tests/browser/customer-release-uat.spec.ts`                 | `custivio-web`                                  | PASS   | Earlier selector/UI issues fixed                                               | No              | 8 passed in 2.1 minutes.                                                |
| 3     | `RUN_VOLUME_TESTS=1 pnpm exec vitest run tests/integration/real-data-volume.test.ts` | `custivio`                                      | PASS   | First sandbox attempt hit localhost DB `EPERM`; escalated localhost run passed | No              | 1 integration test passed; generated records rolled back.               |
| 8     | `pnpm check:forbidden`                                                               | `custivio`                                      | PASS   | None                                                                           | No              | Forbidden dependency check passed.                                      |
| 8     | `pnpm check`                                                                         | `custivio`                                      | PASS   | None                                                                           | No              | Typecheck, lint, format, non-DB tests, and forbidden check passed.      |
| 8     | `pnpm build:api`                                                                     | `custivio`                                      | PASS   | None                                                                           | No              | API TypeScript build passed.                                            |
| 8     | `pnpm test:api`                                                                      | `custivio`                                      | PASS   | None                                                                           | No              | 9 API test files, 37 tests passed.                                      |
| 8     | `RUN_DB_TESTS=1 pnpm test`                                                           | `custivio`                                      | PASS   | None                                                                           | No              | 26 DB-backed files passed, 103 tests passed, 1 skipped.                 |
| 8     | `pnpm db:seed`                                                                       | `custivio`                                      | PASS   | None                                                                           | No              | Base seed completed against local PostgreSQL.                           |
| 8     | `pnpm db:seed:uat`                                                                   | `custivio`                                      | PASS   | None                                                                           | No              | UAT seed completed with seven persona env emails.                       |
| 8     | `bash deploy/proxmox/scripts/validate-all.sh`                                        | `custivio`                                      | PASS   | None                                                                           | No              | Proxmox deployment assets and embedded observability validation passed. |
| 8     | `npm run lint`                                                                       | `custivio-web`                                  | PASS   | Earlier Prettier issue in new browser spec was fixed                           | No              | ESLint passed.                                                          |
| 8     | `npm run typecheck`                                                                  | `custivio-web`                                  | PASS   | None                                                                           | No              | TypeScript check passed.                                                |
| 8     | `npm run test`                                                                       | `custivio-web`                                  | PASS   | None                                                                           | No              | 4 files, 27 tests passed.                                               |
| 8     | `npm run build`                                                                      | `custivio-web`                                  | PASS   | None                                                                           | No              | Vite client/server build and preview entry generation passed.           |
| 8     | `npm run check:api-contract`                                                         | `custivio-web`                                  | PASS   | None                                                                           | No              | OpenAPI contract check passed with 64 generated operations.             |
| 8     | `npm run test:browser`                                                               | `custivio-web`                                  | PASS   | None                                                                           | No              | 10 browser-click tests passed in 2.2 minutes.                           |
| 8     | `bash scripts/validate-config.sh`                                                    | `shared-observability`                          | PASS   | None                                                                           | No              | Shared observability validation passed.                                 |

## Summary

- Final command runs: 18 passed, 0 failed.
- Initial issues resolved or classified: browser selector/UI issues fixed; frontend formatting issue fixed; sandbox-only localhost DB `EPERM` rerun with local DB access.
- Release blockers from validation: 0.

## Result Values

- `PASS`
- `PASS_WITH_NOTES`
- `FAIL`
- `NOT_RUN`
- `IN_PROGRESS`

## Failure Classification

- real blocker
- environment-only
- dependency-only
- safe to fix
