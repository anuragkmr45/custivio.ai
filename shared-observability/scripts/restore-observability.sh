#!/usr/bin/env bash
set -euo pipefail
[ "${CONFIRM_RESTORE:-no}" = "yes" ] || { echo "Set CONFIRM_RESTORE=yes" >&2; exit 3; }
BACKUP="${1:-}"
[ -n "$BACKUP" ] || { echo "Usage: CONFIRM_RESTORE=yes $0 <backup.tar.gz>" >&2; exit 2; }
tar -xzf "$BACKUP"
