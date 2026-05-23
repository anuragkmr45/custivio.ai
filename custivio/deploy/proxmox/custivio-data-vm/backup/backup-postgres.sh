#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${ENV_FILE:-/etc/custivio-data/data-vm.env}"
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/var/backups/custivio/postgres/postgres-$TS.sql.gz"
LOG="/var/backups/custivio/backup.log"
PGPASSWORD="${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}" pg_dump -h "${DATA_PRIVATE_IP:-127.0.0.1}" -U "${POSTGRES_USER:-custivio_app}" "${POSTGRES_DB:-custivio}" | gzip > "$OUT"
sha256sum "$OUT" > "$OUT.sha256"
echo "$TS postgres backup $OUT" >> "$LOG"
