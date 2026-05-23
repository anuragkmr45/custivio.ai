#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.dev.yml"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups/dev/${TIMESTAMP}}"

mkdir -p "${BACKUP_DIR}/minio"

echo "Writing PostgreSQL backup to ${BACKUP_DIR}/postgres.dump"
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U custivio -d custivio --format=custom \
  > "${BACKUP_DIR}/postgres.dump"

echo "Mirroring MinIO bucket to ${BACKUP_DIR}/minio"
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps \
  --entrypoint /bin/sh \
  --volume "${BACKUP_DIR}/minio:/backup" \
  minio-init \
  -c 'mc alias set local "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null && mc mirror --overwrite "local/$MINIO_BUCKET" /backup'

cat > "${BACKUP_DIR}/manifest.txt" <<MANIFEST
custivio dev backup
created_at=${TIMESTAMP}
postgres_dump=postgres.dump
minio_mirror=minio/
MANIFEST

echo "Backup complete: ${BACKUP_DIR}"
