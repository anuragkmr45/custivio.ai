#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-${ROOT_DIR}/dist/release-images}"
ENV_FILE="${PROD_ENV_FILE:-${ROOT_DIR}/infra/env.production.validation.example}"
APP_IMAGE_TAG="${APP_IMAGE_TAG:-validation}"
APP_IMAGE="custivio-api:${APP_IMAGE_TAG}"

mkdir -p "${OUT_DIR}"
docker build -f "${ROOT_DIR}/infra/Dockerfile.api" -t "${APP_IMAGE}" "${ROOT_DIR}"
docker compose \
  --env-file "${ENV_FILE}" \
  -f "${ROOT_DIR}/infra/docker-compose.prod.yml" \
  config --images | sort -u > "${OUT_DIR}/images.txt"

while read -r image; do
  [ -n "${image}" ] || continue
  safe_name="$(echo "${image}" | tr '/:' '__')"
  if [ "${image}" != "${APP_IMAGE}" ]; then
    docker pull "${image}"
  fi
  docker save "${image}" -o "${OUT_DIR}/${safe_name}.tar"
done < "${OUT_DIR}/images.txt"

shasum -a 256 "${OUT_DIR}"/*.tar > "${OUT_DIR}/SHA256SUMS"
echo "Release image bundle written to ${OUT_DIR}"
