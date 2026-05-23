#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0

need_file() { [ -f "$ROOT/$1" ] || { echo "Missing $1" >&2; fail=1; }; }
need_file base/docker-compose.observability.yml
need_file base/prometheus/prometheus.yml
need_file base/grafana/provisioning/datasources/datasources.yml
need_file base/grafana/provisioning/dashboards/dashboards.yml
need_file base/loki/loki.yml
need_file base/otel/collector.yml

if grep -R --exclude='validate-config.sh' "0.0.0.0:3100:3100\|0.0.0.0:9090:9090\|0.0.0.0:4317:4317\|0.0.0.0:4318:4318" "$ROOT" >/dev/null 2>&1; then
  echo "Internal observability services appear publicly bound" >&2
  fail=1
fi

if grep -R --exclude='validate-config.sh' "GF_SECURITY_ADMIN_PASSWORD=admin\|GRAFANA_ADMIN_PASSWORD=admin" "$ROOT" >/dev/null 2>&1; then
  echo "Default Grafana admin password found" >&2
  fail=1
fi

for target in "$ROOT"/orgs/*/targets/*.yml "$ROOT"/base/prometheus/file_sd/*.yml; do
  [ -e "$target" ] || continue
  for label in org software environment role instance; do
    if ! grep -q "^[[:space:]]*$label:" "$target"; then
      echo "Missing label $label in $target" >&2
      fail=1
    fi
  done
done

for script in "$ROOT"/scripts/*.sh; do
  bash -n "$script"
done

if command -v docker >/dev/null 2>&1; then
  (cd "$ROOT/base" && GRAFANA_ENV_FILE=env.example docker compose -f docker-compose.observability.yml config >/dev/null) || fail=1
fi

[ "$fail" -eq 0 ] || exit 1
echo "Shared observability validation passed."
