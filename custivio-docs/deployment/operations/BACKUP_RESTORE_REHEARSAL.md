# Backup Restore Rehearsal

Before production release, rehearse restore into an isolated stack.

## Scope

- PostgreSQL database.
- MinIO bucket objects.
- Production environment file.
- Docker image bundle.

## Rehearsal Steps

1. Stop application writes.
2. Take PostgreSQL backup.
3. Export MinIO bucket.
4. Start an isolated Compose stack.
5. Restore PostgreSQL.
6. Restore MinIO objects.
7. Run database migrations.
8. Run seed.
9. Verify `/api/health/ready`.
10. Verify login and representative asset, stock, export, and attachment workflows.
11. Run `scripts/smoke-api.sh`.
12. Confirm worker service processes at least one import/export queue tick in the isolated stack.

Record rehearsal date, operator, source backup, restore target, and verification result in the release checklist.
