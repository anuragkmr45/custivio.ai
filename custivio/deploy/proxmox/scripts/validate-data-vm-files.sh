#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0
for f in custivio-data-vm/data-vm.env.example custivio-data-vm/docker-compose.data.yml custivio-data-vm/install-data-vm.sh custivio-data-vm/verify-data-vm.sh; do [ -e "$ROOT/$f" ] || { echo "Missing $f" >&2; fail=1; }; done
for f in "$ROOT"/custivio-data-vm/*.sh "$ROOT"/custivio-data-vm/backup/*.sh; do [ -x "$f" ] || { echo "Not executable $f" >&2; fail=1; }; bash -n "$f"; done
if grep -R "0.0.0.0:5432\|0.0.0.0:9000\|0.0.0.0:6379" "$ROOT/custivio-data-vm" >/dev/null; then echo "Public data service bind found" >&2; fail=1; fi
if command -v docker >/dev/null 2>&1; then
  (cd "$ROOT/custivio-data-vm" && DATA_ENV_FILE=data-vm.env.example docker compose -f docker-compose.data.yml config >/dev/null) || fail=1
fi
[ "$fail" -eq 0 ] || exit 1
echo "Data VM files valid."
