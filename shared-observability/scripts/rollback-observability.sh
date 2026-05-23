#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-}"
[ -n "$TARGET" ] || { echo "Usage: $0 <release-path>" >&2; exit 2; }
ln -sfn "$TARGET" /opt/shared-observability/current
bash /opt/shared-observability/current/scripts/validate-config.sh
