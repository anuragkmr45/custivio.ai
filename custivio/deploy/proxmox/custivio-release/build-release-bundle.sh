#!/usr/bin/env bash
set -euo pipefail
VERSION="${1:-}"
[ -n "$VERSION" ] || { echo "Usage: $0 <version>" >&2; exit 2; }
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
OUT="$ROOT/dist/custivio-$VERSION"
BUNDLE="$ROOT/dist/custivio-$VERSION.tar.gz"
rm -rf "$OUT"
mkdir -p "$OUT/frontend" "$OUT/api" "$OUT/worker" "$OUT/docs" "$OUT/migrations" "$OUT/scripts" "$OUT/env-templates"
rsync -a --exclude node_modules --exclude .env --exclude .git --exclude dist --exclude _cleanup_review "$ROOT/" "$OUT/api/"
rsync -a "$ROOT/deploy/proxmox" "$OUT/docs/proxmox"
cp "$ROOT/deploy/proxmox/custivio-app-lxc/custivio-app.env.example" "$OUT/env-templates/"
cp "$ROOT/deploy/proxmox/custivio-release/release-manifest.example.json" "$OUT/manifest.json"
(cd "$OUT" && find . -type f ! -name checksums.sha256 -print0 | sort -z | xargs -0 sha256sum > checksums.sha256)
(cd "$OUT/.." && tar -czf "$BUNDLE" "custivio-$VERSION")
echo "$BUNDLE"
