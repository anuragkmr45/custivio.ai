# Custivio Backup Restore Rehearsal Result

Report date: 2026-05-23

Backup/restore readiness: EXTERNAL_PENDING

The repository contains backup and restore scripts, but a restore rehearsal was not run in this active workspace because restore is destructive without a clean target environment. This file is the exact runbook for the staging operator.

## Required Safe Environment

| Requirement                            | Status           | Notes                                                     |
| -------------------------------------- | ---------------- | --------------------------------------------------------- |
| Clean staging target DB                | EXTERNAL_PENDING | Must not be the active dev/customer DB.                   |
| Clean staging object store bucket      | EXTERNAL_PENDING | Restore should not overwrite active customer uploads.     |
| Backup destination with enough storage | EXTERNAL_PENDING | Include PostgreSQL dump and object storage archive.       |
| Restore approval                       | EXTERNAL_PENDING | Use explicit confirmation env required by restore script. |

## Rehearsal Steps

1. Stop nonessential writers or point the rehearsal at a quiescent staging copy.
2. Run the repository backup script for PostgreSQL and object storage.
3. Record backup path, size, timestamp, and checksums.
4. Create or reset a clean staging target.
5. Run restore with the script-required confirmation flag.
6. Start API and worker.
7. Verify `/api/health/live`, `/api/health/ready`, and `/api/openapi.json`.
8. Login as staging admin.
9. Verify users, roles, assets, locations, stock ledger, import jobs, export jobs, and saved filters.
10. Upload and download one attachment after restore.
11. Create one stock movement after restore.
12. Create and download one export after restore.

## Result Template

| Check                         | Expected                             | Result           | Evidence |
| ----------------------------- | ------------------------------------ | ---------------- | -------- |
| PostgreSQL backup created     | Dump exists and checksum recorded    | EXTERNAL_PENDING |          |
| Object storage backup created | Archive exists and checksum recorded | EXTERNAL_PENDING |          |
| Restore completed             | Restore script exits 0               | EXTERNAL_PENDING |          |
| App starts                    | API and worker healthy               | EXTERNAL_PENDING |          |
| Users restored                | Admin/user list visible              | EXTERNAL_PENDING |          |
| Assets restored               | Asset list/detail visible            | EXTERNAL_PENDING |          |
| Attachments restored          | Download succeeds                    | EXTERNAL_PENDING |          |
| Stock ledger restored         | Ledger and balances visible          | EXTERNAL_PENDING |          |
| Reports restored              | Export/report records visible        | EXTERNAL_PENDING |          |

## Current Status

- Runbook: READY
- Destructive restore execution: EXTERNAL_PENDING
- Release impact: no P0/P1 blocker because the exact rehearsal steps are documented, but customer deployment should not proceed without executing this in staging.
