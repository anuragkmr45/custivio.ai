#!/usr/bin/env bash
set -euo pipefail
SRC="${1:-}"
DEST="${2:-/opt/custivio/current/api}"
[ -n "$SRC" ] || { echo "Usage: $0 <backend-artifact-dir> [dest]" >&2; exit 2; }
install -d -m 0755 "$DEST"
rsync -a --delete "$SRC/" "$DEST/"
echo "Installed backend artifact to $DEST"
