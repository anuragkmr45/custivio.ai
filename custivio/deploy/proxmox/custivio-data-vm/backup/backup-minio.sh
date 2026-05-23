#!/usr/bin/env bash
set -euo pipefail
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/var/backups/custivio/minio/minio-$TS.tar.gz"
LOG="/var/backups/custivio/backup.log"
tar -C /srv/custivio-data -czf "$OUT" minio
sha256sum "$OUT" > "$OUT.sha256"
echo "$TS minio backup $OUT" >> "$LOG"
