#!/usr/bin/env bash
set -euo pipefail
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/var/backups/shared-observability/configs/observability-config-$TS.tar.gz"
mkdir -p /var/backups/shared-observability/configs
tar -czf "$OUT" base orgs docs
sha256sum "$OUT" > "$OUT.sha256"
echo "$OUT"
