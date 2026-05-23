#!/usr/bin/env bash
set -euo pipefail
BUNDLE="${1:-}"
[ -n "$BUNDLE" ] || { echo "Usage: $0 <bundle.tar.gz>" >&2; exit 2; }
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
tar -xzf "$BUNDLE" -C "$TMP"
DIR="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
[ -f "$DIR/manifest.json" ]
[ -f "$DIR/checksums.sha256" ]
(cd "$DIR" && sha256sum -c checksums.sha256)
if find "$DIR" -name '.env' -o -name '*.pem' -o -name '*.key' | grep -q .; then
  echo "Bundle contains forbidden secret-like files" >&2
  exit 1
fi
echo "Release bundle verification passed."
