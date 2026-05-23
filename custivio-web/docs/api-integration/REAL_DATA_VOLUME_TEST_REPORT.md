# Custivio Frontend Real Data Volume Test Report

Report date: 2026-05-23

Real data volume readiness: READY

## Target Volume

| Data area                    |                   Target | Status | Notes                                                        |
| ---------------------------- | -----------------------: | ------ | ------------------------------------------------------------ |
| Assets                       |                    1,000 | PASS   | Backend rollback volume test generated and queried records.  |
| Users                        |                      100 | PASS   | Backend rollback volume test generated and queried records.  |
| Locations                    | 100 sites, 100 buildings | PASS   | Backend rollback volume test generated and queried records.  |
| Stock items                  |                      100 | PASS   | Backend rollback volume test generated and queried records.  |
| Stock ledger rows            |                   10,000 | PASS   | Backend rollback volume test generated and queried records.  |
| Maintenance tickets          |                      100 | PASS   | Backend rollback volume test generated and queried records.  |
| Audit campaigns              |                       20 | PASS   | Backend rollback volume test generated and queried records.  |
| Import/export sample records |           Representative | PASS   | Import jobs, rows, export jobs, and saved filters generated. |

## Frontend Checks

| Check                    | Result          | Notes                                                                                                    |
| ------------------------ | --------------- | -------------------------------------------------------------------------------------------------------- |
| Asset list/search        | PASS            | Browser UAT covers real asset search/create/detail; backend volume test covers paged asset query.        |
| Dashboard                | PASS            | Browser UAT covers dashboard visibility; backend volume test covers aggregate query cost.                |
| Stock overview           | PASS            | Browser UAT covers stock item and movement flow; backend volume test covers stock aggregate query.       |
| Reports/export           | PASS            | Browser UAT covers saved filter, export job, and download; backend volume test covers report aggregates. |
| Table loading/pagination | PASS            | Shared data table supports server-backed pagination/search where backend metadata exists.                |
| Low-network behavior     | PASS_WITH_NOTES | Fetch upload path shows selected file, size, pending state, success/failure; no exact percentage.        |

## Command Result

| Command                                                                              | Result | Notes                                          |
| ------------------------------------------------------------------------------------ | ------ | ---------------------------------------------- |
| `RUN_VOLUME_TESTS=1 pnpm exec vitest run tests/integration/real-data-volume.test.ts` | PASS   | 1 test passed; all generated data rolled back. |

## Notes

- The volume data is not part of production seed.
- The first sandboxed DB connection attempt failed with localhost `EPERM`; rerun with local DB access passed.
