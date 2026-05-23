#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/custivio}"
API_URL="${API_URL:-http://127.0.0.1:3000}"
PUBLIC_URL="${PUBLIC_URL:-}"

echo "Active release: $(readlink -f "$APP_ROOT/current" 2>/dev/null || echo none)"

echo "Checking API live..."
curl -fsS "$API_URL/api/health/live" >/dev/null

echo "Checking API ready..."
curl -fsS "$API_URL/api/health/ready" >/dev/null

echo "Checking OpenAPI..."
curl -fsS "$API_URL/api/openapi.json" >/dev/null

echo "Checking worker service..."
systemctl is-active --quiet custivio-worker

if [ -n "$PUBLIC_URL" ]; then
  echo "Checking frontend..."
  curl -fsS "$PUBLIC_URL/" >/dev/null
fi

echo "App verification passed."
