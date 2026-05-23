#!/usr/bin/env bash
set -euo pipefail
ORG="${1:-}"; SOFTWARE="${2:-}"
[ -n "$ORG" ] && [ -n "$SOFTWARE" ] || { echo "Usage: $0 <org-slug> <software>" >&2; exit 2; }
mkdir -p "orgs/$ORG/targets"
TARGET="orgs/$ORG/targets/$SOFTWARE.targets.yml"
[ -f "$TARGET" ] || cat > "$TARGET" <<EOF
- targets:
    - <PRIVATE_IP>:<PORT>
  labels:
    org: $ORG
    software: $SOFTWARE
    environment: staging
    role: api
    instance: ${SOFTWARE}-api-1
EOF
echo "$TARGET"
