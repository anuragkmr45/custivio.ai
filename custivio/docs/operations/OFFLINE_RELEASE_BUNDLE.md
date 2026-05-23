# Offline Release Bundle

Use this process for air-gapped sites.

## Online Build Host

```bash
scripts/build-offline-pnpm-store.sh dist/offline-pnpm-store
scripts/export-release-images.sh dist/release-images
scripts/verify-release-bundle.sh dist/release-images
```

Transfer these folders to the air-gapped environment:

- `dist/offline-pnpm-store`
- `dist/release-images`
- source release archive
- production env template with secrets filled by the operator

## Air-Gapped Host

```bash
scripts/verify-release-bundle.sh dist/release-images
for image in dist/release-images/*.tar; do docker load -i "$image"; done
scripts/validate-prod-compose.sh infra/env.production.validation.example
docker compose --env-file infra/env.production.example -f infra/docker-compose.prod.yml up -d
scripts/smoke-api.sh
```

Never place production secrets in the source release archive.
