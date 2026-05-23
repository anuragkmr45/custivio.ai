# Production Deployment

This deployment target runs the Fastify API and self-hosted dependencies on Docker Compose.

## Required Inputs

- PostgreSQL password.
- MinIO access key and secret.
- Grafana admin password.
- Public API base URL.
- Allowed frontend origin.

Use `infra/env.production.example` as a template. Replace every `REPLACE_ME` value before use.

## Build

```bash
pnpm install
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
pnpm db:migrate
pnpm db:seed
pnpm db:seed
scripts/validate-prod-compose.sh
docker build -f infra/Dockerfile.api -t custivio-api:local .
```

## Start

```bash
docker compose --env-file infra/env.production.example -f infra/docker-compose.prod.yml up -d
```

## Worker Runtime

Production Compose runs a separate `worker` service from the same API image.

Default worker command:

```bash
pnpm --filter @custivio/api worker -- --queue all --interval-ms 5000
```

Local smoke command:

```bash
pnpm worker -- --once --queue imports
pnpm worker -- --once --queue exports
```

The worker consumes Valkey queues for import processing and export verification, uses distributed locks, and records retry/dead-letter metrics.

## Verify

```bash
scripts/smoke-api.sh
```

## Rollback

Keep the previous image tag and database/MinIO backup until the new stack has passed readiness and smoke checks. Use `docs/operations/ROLLBACK.md` for the exact rollback sequence.

## Release Command Sequence

1. `pnpm install`
2. `pnpm check:forbidden`
3. `pnpm check`
4. `pnpm build:api`
5. `pnpm test:api`
6. `RUN_DB_TESTS=1 pnpm test`
7. `pnpm db:migrate`
8. `pnpm db:seed`
9. `pnpm db:seed`
10. `scripts/validate-prod-compose.sh`
11. `docker build -f infra/Dockerfile.api -t custivio-api:<tag> .`
12. `scripts/export-release-images.sh dist/release-images`
13. `scripts/build-offline-pnpm-store.sh dist/offline-pnpm-store`
14. Take PostgreSQL and MinIO backups before upgrade.
15. `docker compose --env-file infra/env.production.example -f infra/docker-compose.prod.yml up -d`
16. `scripts/smoke-api.sh`
17. If smoke fails, follow `docs/operations/ROLLBACK.md`.
