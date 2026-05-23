#!/usr/bin/env bash
set -euo pipefail
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/var/backups/custivio/valkey/valkey-$TS.tar.gz"
LOG="/var/backups/custivio/backup.log"
tar -C /srv/custivio-data -czf "$OUT" valkey
sha256sum "$OUT" > "$OUT.sha256"
echo "$TS valkey backup $OUT" >> "$LOG"
