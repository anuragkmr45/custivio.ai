# Custivio Real Data Volume Test Report

Report date: 2026-05-23

Real data volume readiness: READY

## Test Scope

The volume test is dev/test-only and rolls back all generated data in one database transaction. It does not modify production seed or UAT seed data.

| Data area                    |                                                          Target | Result | Evidence                                     |
| ---------------------------- | --------------------------------------------------------------: | ------ | -------------------------------------------- |
| Assets                       |                                                           1,000 | PASS   | `tests/integration/real-data-volume.test.ts` |
| Users                        |                                                             100 | PASS   | `tests/integration/real-data-volume.test.ts` |
| Locations                    |                                        100 sites, 100 buildings | PASS   | `tests/integration/real-data-volume.test.ts` |
| Stock items                  |                                                             100 | PASS   | `tests/integration/real-data-volume.test.ts` |
| Stock ledger rows            |                                                          10,000 | PASS   | `tests/integration/real-data-volume.test.ts` |
| Maintenance tickets          |                                                             100 | PASS   | `tests/integration/real-data-volume.test.ts` |
| Audit campaigns              |                                                              20 | PASS   | `tests/integration/real-data-volume.test.ts` |
| Import/export/report records | 5 import jobs, 100 import rows, 5 export jobs, 10 saved filters | PASS   | `tests/integration/real-data-volume.test.ts` |

## Command Result

| Command                                                                              | Result | Notes                                                               |
| ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------- |
| `RUN_VOLUME_TESTS=1 pnpm exec vitest run tests/integration/real-data-volume.test.ts` | PASS   | Passed against local PostgreSQL after allowing localhost DB access. |

## Performance Gates

| Check                                     |      Limit | Result |
| ----------------------------------------- | ---------: | ------ |
| Asset count plus page query at offset 950 | < 5,000 ms | PASS   |
| Dashboard aggregate query                 | < 5,000 ms | PASS   |
| Stock item/ledger aggregate query         | < 5,000 ms | PASS   |
| Reporting aggregate query                 | < 5,000 ms | PASS   |

## Notes

- The first sandboxed attempt failed with `EPERM` connecting to localhost PostgreSQL; this was environment-only.
- The passing run used the same local database services as DB integration tests.
- Frontend table behavior is covered separately by browser UAT and the shared server-pagination table implementation.
