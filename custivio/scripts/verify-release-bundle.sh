#!/usr/bin/env bash
set -euo pipefail

BUNDLE_DIR="${1:?usage: scripts/verify-release-bundle.sh <bundle-dir>}"

test -f "${BUNDLE_DIR}/images.txt"
test -f "${BUNDLE_DIR}/SHA256SUMS"

(cd "${BUNDLE_DIR}" && shasum -a 256 -c SHA256SUMS)
echo "Release bundle checksums verified."
