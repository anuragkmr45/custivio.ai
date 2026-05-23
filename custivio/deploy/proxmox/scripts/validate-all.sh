#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"

echo "Validating Proxmox deployment assets in $ROOT"
bash "$ROOT/scripts/validate-app-lxc-files.sh"
bash "$ROOT/scripts/validate-data-vm-files.sh"
bash "$ROOT/scripts/validate-release-bundle.sh"
bash "$ROOT/scripts/validate-firewall-docs.sh"
bash "$ROOT/scripts/validate-operator-docs.sh"

for f in $(find "$ROOT" -name '*.sh' -type f); do bash -n "$f"; done

if grep -R --exclude='validate-all.sh' "password123\|changeme\|defaultpassword\|secretpassword" "$ROOT" >/dev/null 2>&1; then
  echo "Unsafe placeholder secret found" >&2
  exit 1
fi

if [ -x "$REPO/../shared-observability/scripts/validate-config.sh" ]; then
  bash "$REPO/../shared-observability/scripts/validate-config.sh"
fi

echo "All Proxmox validation checks passed."
