#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for f in docs/FIREWALL_RULES.md docs/NETWORK_SECURITY_PLAN.md NETWORK_PORT_MATRIX.md security/FIREWALL_TEMPLATE.md; do [ -f "$ROOT/$f" ] || { echo "Missing $f" >&2; exit 1; }; done
for svc in PostgreSQL MinIO Valkey Prometheus Loki OTel; do grep -R "$svc" "$ROOT/docs" "$ROOT/security" >/dev/null; done
echo "Firewall docs valid."
