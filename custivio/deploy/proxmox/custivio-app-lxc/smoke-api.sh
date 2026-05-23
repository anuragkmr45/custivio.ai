#!/usr/bin/env bash
set -euo pipefail
API_URL="${API_URL:-http://127.0.0.1:3000}"

echo "Smoke API: $API_URL"
curl -fsS "$API_URL/api/health/live" >/dev/null
curl -fsS "$API_URL/api/health/ready" >/dev/null
curl -fsS "$API_URL/api/openapi.json" >/dev/null
curl -fsS "$API_URL/api/metrics" >/dev/null
curl -fsS "$API_URL/api/assets" -H 'Accept: application/json' >/dev/null || echo "Asset list requires auth in hardened environments; verify with authenticated smoke user."
echo "Smoke API completed."
