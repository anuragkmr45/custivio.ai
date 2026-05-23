#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${ENV_FILE:-/etc/custivio-data/data-vm.env}"
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a
: "${POSTGRES_DB:=custivio}"
: "${POSTGRES_USER:=custivio_app}"
: "${DATA_PRIVATE_IP:=127.0.0.1}"
: "${MINIO_BUCKET:=custivio}"

 echo "Checking disk space..."
df -h /srv/custivio-data /var/backups/custivio

echo "Checking PostgreSQL..."
PGPASSWORD="${POSTGRES_PASSWORD:-}" psql -h "$DATA_PRIVATE_IP" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'select 1' >/dev/null

echo "Checking MinIO health..."
curl -fsS "http://$DATA_PRIVATE_IP:9000/minio/health/live" >/dev/null

echo "Checking Valkey..."
valkey-cli -h "$DATA_PRIVATE_IP" -a "${VALKEY_PASSWORD:-}" ping | grep -q PONG

echo "Checking backup write permission..."
touch /var/backups/custivio/.write-test && rm /var/backups/custivio/.write-test

echo "Data VM verification passed."
