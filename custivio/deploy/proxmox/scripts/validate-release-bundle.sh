#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for f in custivio-release/release-manifest.example.json custivio-release/build-release-bundle.sh custivio-release/verify-release-bundle.sh custivio-release/install-release-bundle.sh custivio-release/rollback-release.sh custivio-release/FIRST_TIME_DEPLOYMENT.md custivio-release/UPDATE_DEPLOYMENT.md custivio-release/ROLLBACK_DEPLOYMENT.md; do
  [ -e "$ROOT/$f" ] || { echo "Missing $f" >&2; exit 1; }
done
for f in "$ROOT"/custivio-release/*.sh; do [ -x "$f" ] || { echo "Not executable $f" >&2; exit 1; }; bash -n "$f"; done
python3 -m json.tool "$ROOT/custivio-release/release-manifest.example.json" >/dev/null
echo "Release bundle files valid."
