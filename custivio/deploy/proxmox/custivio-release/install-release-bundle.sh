#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$DIR/verify-release-bundle.sh" "${1:?bundle required}"
bash "$DIR/../custivio-app-lxc/deploy-release.sh" "${1:?bundle required}" "${2:?version required}"
