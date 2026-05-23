#!/usr/bin/env bash
set -euo pipefail
BACKEND_ROOT="${BACKEND_ROOT:-../../../..}"
OUT_DIR="${OUT_DIR:-./backend-artifact}"

(cd "$BACKEND_ROOT" && pnpm build:api)
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/api"
rsync -a --exclude node_modules --exclude .env --exclude deploy/proxmox --exclude .git "$BACKEND_ROOT/" "$OUT_DIR/api/"
echo "Backend source artifact created at $OUT_DIR/api"
echo "Runtime uses pnpm/tsx because current API build does not emit compiled JavaScript."
