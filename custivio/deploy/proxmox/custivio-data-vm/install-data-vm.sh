#!/usr/bin/env bash
set -euo pipefail
ETC_ROOT="${ETC_ROOT:-/etc/custivio-data}"
DATA_ROOT="${DATA_ROOT:-/srv/custivio-data}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/custivio}"

install -d -m 0750 "$ETC_ROOT"
install -d -m 0750 "$DATA_ROOT/postgres" "$DATA_ROOT/minio" "$DATA_ROOT/valkey"
install -d -m 0750 "$BACKUP_ROOT/postgres" "$BACKUP_ROOT/minio" "$BACKUP_ROOT/valkey" "$BACKUP_ROOT/release-manifests" "$BACKUP_ROOT/restore-rehearsals"
if [ ! -f "$ETC_ROOT/data-vm.env" ]; then
  install -m 0640 data-vm.env.example "$ETC_ROOT/data-vm.env"
  echo "Created $ETC_ROOT/data-vm.env. Edit placeholders before starting services."
fi
echo "Data VM directories prepared."
