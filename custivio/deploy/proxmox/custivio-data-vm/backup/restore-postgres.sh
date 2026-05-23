#!/usr/bin/env bash
set -euo pipefail
[ "${CONFIRM_RESTORE:-no}" = "yes" ] || { echo "Set CONFIRM_RESTORE=yes to restore" >&2; exit 3; }
BACKUP="${1:-}"
[ -n "$BACKUP" ] || { echo "Usage: CONFIRM_RESTORE=yes $0 <backup.sql.gz>" >&2; exit 2; }
ENV_FILE="${ENV_FILE:-/etc/custivio-data/data-vm.env}"
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a
gunzip -c "$BACKUP" | PGPASSWORD="${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}" psql -h "${DATA_PRIVATE_IP:-127.0.0.1}" -U "${POSTGRES_USER:-custivio_app}" "${POSTGRES_DB:-custivio}"
