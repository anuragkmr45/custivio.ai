#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3000}"

check_endpoint() {
  local path="$1"
  curl -fsS "${API_BASE_URL}${path}" > /dev/null
  echo "OK ${path}"
}

check_endpoint "/api/health/live"
check_endpoint "/api/health/ready"
check_endpoint "/api/metrics"
check_endpoint "/api/ops/status"
check_endpoint "/api/openapi.json"
check_endpoint "/api/docs"

echo "API smoke checks passed for ${API_BASE_URL}."
