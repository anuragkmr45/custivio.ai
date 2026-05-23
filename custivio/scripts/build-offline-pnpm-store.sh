#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-${ROOT_DIR}/dist/offline-pnpm-store}"

mkdir -p "${OUT_DIR}"
pnpm fetch --prod
pnpm store path > "${OUT_DIR}/pnpm-store-path.txt"
cp pnpm-lock.yaml "${OUT_DIR}/pnpm-lock.yaml"

echo "Offline pnpm store metadata written to ${OUT_DIR}"
