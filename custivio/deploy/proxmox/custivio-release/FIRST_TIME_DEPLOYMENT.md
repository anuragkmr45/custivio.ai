# First Time Deployment

## Required steps

1. Confirm canonical paths from `../docs/DEPLOYMENT_PATH_STRATEGY.md`.
2. Confirm secrets are under `/etc`, data is under `/srv`, and backups are under `/var/backups`.
3. Take PostgreSQL backup before any migration update.
4. Take MinIO/config backup if storage or env changes.
5. Verify release bundle checksums.
6. Stop worker before backend or migration changes.
7. Install new release under `/opt/custivio/releases/<version>`.
8. Run migrations only if the manifest requires them.
9. Switch `/opt/custivio/current`.
10. Restart API, verify health, restart worker.
11. Run smoke tests: health live, health ready, OpenAPI, metrics, and authenticated business flow where available.
12. Confirm Prometheus target health.
13. If rollback is needed, use symlink rollback unless database restore is required.

## DB migration warning

Database migration rollback requires manual DBA approval. Do not automatically restore a database over production without explicit approval and `CONFIRM_RESTORE=yes`.

## Maintenance window

Record window start/end, operator, release version, backup timestamp, migration status, validation result, rollback decision, and final active release.
