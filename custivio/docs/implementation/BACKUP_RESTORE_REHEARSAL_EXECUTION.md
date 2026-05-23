# Custivio Backup Restore Rehearsal Execution

Report date: 2026-05-23

Execution status: EXTERNAL_PENDING

Reason: no clean external staging environment, SSH access, DNS, or backup target was provided in this workspace. Restore is destructive and must not be run against an active development or pilot database.

## Required Environment

| Requirement                | Status           | Notes                                                              |
| -------------------------- | ---------------- | ------------------------------------------------------------------ |
| Clean staging data VM      | EXTERNAL_PENDING | Must be disposable or explicitly approved for destructive restore. |
| Staging app LXC            | EXTERNAL_PENDING | Must point to the staging data VM.                                 |
| Backup storage path        | EXTERNAL_PENDING | Default Proxmox path is `/var/backups/custivio`.                   |
| Test admin account         | EXTERNAL_PENDING | Created by bootstrap CLI or UAT seed.                              |
| Test asset with attachment | EXTERNAL_PENDING | Required before backup.                                            |
| Restore approval           | EXTERNAL_PENDING | Operator must confirm restore target.                              |

## Rehearsal Steps

1. Create a clean staging environment.
2. Run migrations.
3. Bootstrap first tenant/admin or run UAT seed for demo staging.
4. Create or verify:
   - at least one user login;
   - at least one asset;
   - at least one attachment;
   - at least one stock movement;
   - at least one export/report record.
5. Backup PostgreSQL:

```bash
cd /path/to/custivio/deploy/proxmox/custivio-data-vm/backup
sudo bash backup-postgres.sh
```

6. Backup MinIO:

```bash
sudo bash backup-minio.sh
```

7. Backup Valkey if operational state must be preserved:

```bash
sudo bash backup-valkey.sh
```

8. Record artifact paths, sizes, timestamps, and checksums.
9. Destroy or replace staging data only in the approved rehearsal environment.
10. Restore PostgreSQL:

```bash
CONFIRM_RESTORE=yes sudo bash restore-postgres.sh /var/backups/custivio/<postgres-backup>.sql.gz
```

11. Restore MinIO:

```bash
CONFIRM_RESTORE=yes sudo bash restore-minio.sh /var/backups/custivio/<minio-backup>
```

12. Restore Valkey only if required for operational state:

```bash
CONFIRM_RESTORE=yes sudo bash restore-valkey.sh /var/backups/custivio/<valkey-backup>
```

13. Restart API and worker.
14. Verify login.
15. Verify asset list/detail.
16. Verify attachment download.
17. Verify stock ledger.
18. Verify reports/export download.
19. Verify import/export worker jobs.
20. Record evidence.

## Evidence Log

| Check                                                   | Result           | Evidence                           |
| ------------------------------------------------------- | ---------------- | ---------------------------------- |
| PostgreSQL backup artifact exists                       | EXTERNAL_PENDING | Record path/checksum.              |
| MinIO backup artifact exists                            | EXTERNAL_PENDING | Record path/checksum.              |
| Valkey backup artifact exists or skipped with rationale | EXTERNAL_PENDING | Record path/checksum or skip note. |
| PostgreSQL restore succeeds                             | EXTERNAL_PENDING | Record command output.             |
| MinIO restore succeeds                                  | EXTERNAL_PENDING | Record command output.             |
| Login works after restore                               | EXTERNAL_PENDING | Record URL/user/timestamp.         |
| Assets work after restore                               | EXTERNAL_PENDING | Record asset tag.                  |
| Attachment download works after restore                 | EXTERNAL_PENDING | Record attachment name.            |
| Stock ledger works after restore                        | EXTERNAL_PENDING | Record movement ID.                |
| Reports/export works after restore                      | EXTERNAL_PENDING | Record export ID/download result.  |

## Acceptance

Backup/restore readiness becomes `READY` only after the restore completes in a clean staging clone and all verification checks pass.
