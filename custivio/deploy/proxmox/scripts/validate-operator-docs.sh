#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
required=(
  docs/DEPLOYMENT_PATH_STRATEGY.md docs/NEW_OPERATOR_QUICKSTART.md docs/UPDATE_PATCH_RUNBOOK.md docs/ROLLBACK_RUNBOOK.md docs/ENVIRONMENT_VARIABLES.md docs/PROXMOX_DEPLOYMENT_INDEX.md
  DEPLOYMENT_MASTER_PLAN.md DEPLOYMENT_TASK_BOARD.md DEPLOYMENT_PROGRESS.md RESUME_INSTRUCTIONS.md PROXMOX_DEPLOYMENT_READINESS_AUDIT.md
)
for f in "${required[@]}"; do [ -f "$ROOT/$f" ] || { echo "Missing $f" >&2; exit 1; }; done
for path in /opt/custivio/current /etc/custivio /srv/custivio-data/postgres /srv/custivio-data/minio /srv/custivio-data/valkey /var/backups/custivio /opt/shared-observability /etc/shared-observability /srv/shared-observability /var/backups/shared-observability; do
  grep -R "$path" "$ROOT/docs/DEPLOYMENT_PATH_STRATEGY.md" >/dev/null || { echo "Missing canonical path $path" >&2; exit 1; }
done
grep -q "Proxmox deployment model" "$REPO/README.md" || { echo "README missing Proxmox deployment section" >&2; exit 1; }
grep -R "secrets.*under /etc\|Secrets.*under /etc" "$ROOT" >/dev/null || { echo "Secrets path rule not documented" >&2; exit 1; }
echo "Operator docs valid."
