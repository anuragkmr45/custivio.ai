#!/usr/bin/env bash
set -euo pipefail
bash scripts/validate-config.sh
if command -v docker >/dev/null 2>&1; then
  (cd base && docker compose -f docker-compose.observability.yml up -d)
fi
