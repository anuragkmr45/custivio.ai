#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.dev.yml"
BACKUP_DIR="${1:-${BACKUP_DIR:-}}"

if [[ -z "${BACKUP_DIR}" ]]; then
  echo "Usage: CONFIRM_RESTORE=1 pnpm restore:dev -- /absolute/path/to/backup" >&2
  exit 2
fi

if [[ "${CONFIRM_RESTORE:-}" != "1" ]]; then
  echo "Refusing destructive restore. Set CONFIRM_RESTORE=1 to replace dev data." >&2
  exit 2
fi

if [[ ! -f "${BACKUP_DIR}/postgres.dump" ]]; then
  echo "Missing PostgreSQL dump: ${BACKUP_DIR}/postgres.dump" >&2
  exit 2
fi

echo "Restoring PostgreSQL from ${BACKUP_DIR}/postgres.dump"
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  dropdb --if-exists -U custivio custivio
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  createdb -U custivio custivio
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_restore -U custivio -d custivio --no-owner \
  < "${BACKUP_DIR}/postgres.dump"

if [[ -d "${BACKUP_DIR}/minio" ]]; then
  echo "Restoring MinIO bucket from ${BACKUP_DIR}/minio"
  docker compose -f "${COMPOSE_FILE}" run --rm --no-deps \
    --entrypoint /bin/sh \
    --volume "${BACKUP_DIR}/minio:/backup" \
    minio-init \
    -c 'mc alias set local "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null && mc mirror --overwrite /backup "local/$MINIO_BUCKET"'
fi

echo "Restore complete."
