#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/custivio}"
RELEASES="$APP_ROOT/releases"
CURRENT="$APP_ROOT/current"
BUNDLE="${1:-}"
VERSION="${2:-}"

if [ -z "$BUNDLE" ] || [ -z "$VERSION" ]; then
  echo "Usage: $0 <custivio-version.tar.gz> <version>" >&2
  exit 2
fi

BEFORE="$(readlink -f "$CURRENT" 2>/dev/null || true)"
TARGET="$RELEASES/$VERSION"
TMP="$RELEASES/.tmp-$VERSION-$$"
EXTRACT="$TMP/extract"

echo "Active release before deploy: ${BEFORE:-none}"
mkdir -p "$EXTRACT"
tar -xzf "$BUNDLE" -C "$EXTRACT"
PAYLOAD="$EXTRACT"
TOP_LEVEL_COUNT="$(find "$EXTRACT" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
if [ "$TOP_LEVEL_COUNT" = "1" ]; then
  PAYLOAD="$(find "$EXTRACT" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
fi
if [ -f "$PAYLOAD/checksums.sha256" ]; then
  (cd "$PAYLOAD" && sha256sum -c checksums.sha256)
fi
mv "$PAYLOAD" "$TARGET"
rm -rf "$TMP"
ln -sfn "$TARGET" "$CURRENT"

systemctl restart custivio-api
bash "${APP_ROOT}/tools/verify-app.sh" || {
  echo "Health check failed; rolling back to ${BEFORE:-none}" >&2
  if [ -n "$BEFORE" ]; then ln -sfn "$BEFORE" "$CURRENT"; systemctl restart custivio-api; fi
  exit 1
}
systemctl restart custivio-worker

echo "Active release after deploy: $(readlink -f "$CURRENT")"
