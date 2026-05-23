# Update And Patch Runbook

## Application update

1. Confirm active release.
2. Run DB and object storage backups.
3. Verify the new bundle checksum.
4. Stop worker.
5. Install release into a new version folder.
6. Run migrations only when required by manifest.
7. Switch `current` symlink.
8. Restart API, verify health, restart worker.
9. Run smoke tests and check Prometheus target health.

## Frontend-only update

Deploy a bundle with `frontendIncluded=true` and `backendIncluded=false`. Switch symlink and reload reverse proxy if needed.

## Backend-only update

Deploy API and worker artifacts together. Stop worker before switching release.

## DB migration update

Take a verified backup first. Review migration notes. Rollback requires DBA approval.

## Security patch update

Apply OS/runtime patches in staging first, validate, schedule a maintenance window, then patch production.

## Observability stack update

Use `shared-observability/scripts/update-observability.sh`, validate config, then restart the observability compose stack.

## Failed update rollback

Run rollback immediately if health, smoke, or worker checks fail and no migration rollback is needed.
