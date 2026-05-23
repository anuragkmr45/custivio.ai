#!/usr/bin/env bash
set -euo pipefail
FRONTEND_ROOT="${FRONTEND_ROOT:-../../../../custivio-web}"
OUT_DIR="${OUT_DIR:-./frontend-artifact}"
API_BASE_URL="${VITE_API_BASE_URL:-https://custivio.example.internal}"

(cd "$FRONTEND_ROOT" && VITE_API_BASE_URL="$API_BASE_URL" npm run build)
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -R "$FRONTEND_ROOT/dist/client/." "$OUT_DIR/"
echo "Frontend artifact created at $OUT_DIR"
