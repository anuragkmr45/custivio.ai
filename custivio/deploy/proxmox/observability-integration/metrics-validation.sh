#!/usr/bin/env bash
set -euo pipefail
API_URL="${API_URL:-http://127.0.0.1:3000}"
OTEL_URL="${OTEL_URL:-http://127.0.0.1:4318}"
TARGET_FILE="${TARGET_FILE:-prometheus-targets.custivio.yml}"

curl -fsS "$API_URL/api/health/ready" >/dev/null
curl -fsS "$API_URL/api/metrics" >/dev/null
curl -fsS "$OTEL_URL" >/dev/null || echo "OTel HTTP endpoint may return non-200 without payload; confirm network reachability separately."
for label in org software environment role instance; do
  grep -q "^[[:space:]]*$label:" "$TARGET_FILE"
done
echo "Metrics validation passed."
