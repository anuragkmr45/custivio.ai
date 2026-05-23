#!/usr/bin/env bash
set -euo pipefail
ORG="${1:-}"
[ -n "$ORG" ] || { echo "Usage: $0 <org-slug>" >&2; exit 2; }
mkdir -p "orgs/$ORG/targets" "orgs/$ORG/dashboards" "orgs/$ORG/alerts"
[ -f "orgs/$ORG/org.env" ] || cat > "orgs/$ORG/org.env" <<EOF
ORG_SLUG=$ORG
ORG_DISPLAY_NAME=$ORG
ORG_PRIVATE_CIDR=<ORG_PRIVATE_CIDR>
ENVIRONMENT=staging
PROMETHEUS_RETENTION=30d
LOKI_RETENTION=14d
LOKI_TENANT_ID=$ORG
ALLOWED_ADMIN_CIDR=<ADMIN_CIDR>
EOF
echo "Created orgs/$ORG"
