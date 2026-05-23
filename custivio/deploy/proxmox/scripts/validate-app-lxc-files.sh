#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0
need() { [ -e "$ROOT/$1" ] || { echo "Missing $1" >&2; fail=1; }; }
need custivio-app-lxc/custivio-app.env.example
need custivio-app-lxc/install-app-lxc.sh
need custivio-app-lxc/deploy-release.sh
need custivio-app-lxc/rollback-release.sh
need custivio-app-lxc/verify-app.sh
need custivio-app-lxc/systemd/custivio-api.service
need custivio-app-lxc/systemd/custivio-worker.service
need custivio-app-lxc/reverse-proxy/Caddyfile.example
need custivio-app-lxc/reverse-proxy/nginx.conf.example
for f in "$ROOT"/custivio-app-lxc/*.sh "$ROOT"/custivio-app-lxc/frontend/*.sh "$ROOT"/custivio-app-lxc/backend/*.sh; do
  [ -x "$f" ] || { echo "Not executable $f" >&2; fail=1; }
  bash -n "$f"
done
if grep -R "Docker-in-LXC required\|privileged LXC required" "$ROOT/custivio-app-lxc" >/dev/null; then echo "Forbidden app LXC requirement found" >&2; fail=1; fi
[ "$fail" -eq 0 ] || exit 1
echo "App LXC files valid."
