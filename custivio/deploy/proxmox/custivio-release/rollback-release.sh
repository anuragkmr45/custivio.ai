#!/usr/bin/env bash
set -euo pipefail
bash "$(dirname "${BASH_SOURCE[0]}")/../custivio-app-lxc/rollback-release.sh" "${1:?version required}"
