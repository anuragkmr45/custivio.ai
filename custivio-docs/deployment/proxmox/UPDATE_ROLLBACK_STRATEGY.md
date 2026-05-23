# Update And Rollback Strategy

## Update flow
1. Confirm current release with `readlink -f /opt/custivio/current`.
2. Back up PostgreSQL and MinIO metadata/config as needed.
3. Upload and verify the new release bundle.
4. Stop worker before migrations.
5. Install new release under `/opt/custivio/releases/<version>`.
6. Run migrations when manifest says `requiresDbMigration=true`.
7. Switch `/opt/custivio/current` to the new release.
8. Restart API, verify health, restart worker, run smoke tests.
9. Confirm Prometheus target health.

## Rollback flow
1. Stop worker.
2. Switch `/opt/custivio/current` to previous release.
3. Restart API and verify health.
4. Restart worker and run smoke tests.
5. Stop if DB rollback is required and obtain manual DBA approval.

## Rollback boundary
Symlink rollback handles application code. It does not automatically reverse database changes or restore object storage.
