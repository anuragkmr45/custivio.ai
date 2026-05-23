#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/custivio}"
CURRENT="$APP_ROOT/current"
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "Available releases:"
  ls -1 "$APP_ROOT/releases" || true
  echo "Usage: $0 <version>" >&2
  exit 2
fi

BEFORE="$(readlink -f "$CURRENT" 2>/dev/null || true)"
NEXT="$APP_ROOT/releases/$TARGET"
[ -d "$NEXT" ] || { echo "Release not found: $NEXT" >&2; exit 1; }

echo "Active release before rollback: ${BEFORE:-none}"
systemctl stop custivio-worker || true
ln -sfn "$NEXT" "$CURRENT"
systemctl restart custivio-api
bash "$APP_ROOT/tools/verify-app.sh"
systemctl restart custivio-worker

echo "Active release after rollback: $(readlink -f "$CURRENT")"
