# Rollback Runbook

## Normal app rollback
1. List releases under `/opt/custivio/releases`.
2. Stop `custivio-worker`.
3. Switch `/opt/custivio/current` to the previous release.
4. Restart `custivio-api`.
5. Run health checks.
6. Restart `custivio-worker`.
7. Run smoke tests.

## Frontend rollback
Switch to a release containing the previous frontend artifact and reload the reverse proxy if static assets are cached.

## Backend rollback
Switch the symlink, restart API and worker, and check logs with `journalctl`.

## DB migration warning
Do not auto-rollback migrations. Stop and get manual DBA approval.

## Emergency restore
Use the Data VM restore scripts with `CONFIRM_RESTORE=yes` only after confirming the restore target and backup timestamp.
