#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-${ROOT_DIR}/infra/env.production.validation.example}"

docker compose \
  --env-file "${ENV_FILE}" \
  -f "${ROOT_DIR}/infra/docker-compose.prod.yml" \
  config > /dev/null

echo "Production Compose config is valid with ${ENV_FILE}."
