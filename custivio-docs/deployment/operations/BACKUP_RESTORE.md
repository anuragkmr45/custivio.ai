# Backup And Restore Runbook

## Scope

This runbook covers local/dev PostgreSQL and MinIO backup mechanics for Phase 9. Production
operators should adapt the same logical flow to approved storage media and retention policies.

## Backup

1. Confirm dependency readiness at `/api/health/ready` or `/api/ops/status`.
2. Run `pnpm backup:dev`.
3. Store the generated `backups/dev/<timestamp>/` directory on approved encrypted media.
4. Record the backup timestamp, operator, database migration level, and object bucket name in the
   change ticket.

The script creates:

- `postgres.dump`: PostgreSQL custom-format dump.
- `minio/`: MinIO bucket mirror.
- `manifest.txt`: backup metadata.

## Restore

Restores replace local/dev data and require an explicit guard:

```bash
CONFIRM_RESTORE=1 pnpm restore:dev -- /absolute/path/to/backups/dev/<timestamp>
```

After restore:

1. Run `pnpm db:migrate`.
2. Run `pnpm db:seed`.
3. Check `/api/health/ready`.
4. Run the release smoke checklist in `docs/operations/RELEASE_CHECKLIST.md`.

## Production Notes

- Use encrypted, access-controlled backup storage.
- Keep PostgreSQL dumps and MinIO object mirrors from the same maintenance window together.
- Test restore on an isolated environment before each release.
- Do not store production attachment data on the app server filesystem.
- Keep PostgreSQL dumps and MinIO object mirrors from the same release window together for rollback consistency.
