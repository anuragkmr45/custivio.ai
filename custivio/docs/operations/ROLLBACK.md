# Rollback Runbook

Use this runbook when a production deployment fails smoke checks or shows unsafe behavior after release.

## Preconditions

- Previous API image tag is recorded.
- PostgreSQL backup from the pre-upgrade window exists.
- MinIO object mirror from the same window exists.
- Current failed release logs and request IDs are preserved.

## Steps

1. Stop write traffic at the frontend or ingress layer.
2. Capture `docker compose --env-file infra/env.production.example -f infra/docker-compose.prod.yml ps`.
3. Stop API and worker services:
   ```bash
   docker compose --env-file infra/env.production.example -f infra/docker-compose.prod.yml stop api worker
   ```
4. Restore the previous API image tag in `APP_IMAGE_TAG`.
5. Restore PostgreSQL from the pre-upgrade backup if migrations changed data.
6. Restore MinIO from the matching object mirror if file/object writes occurred.
7. Start dependencies, API, and worker:
   ```bash
   docker compose --env-file infra/env.production.example -f infra/docker-compose.prod.yml up -d
   ```
8. Run `scripts/smoke-api.sh`.
9. Confirm `/api/health/ready`, `/api/ops/status`, and `/api/metrics`.
10. Record rollback time, operator, image tag, backup ID, and smoke result in the release ticket.

Do not delete failed-release images or backups until the incident review is complete.
