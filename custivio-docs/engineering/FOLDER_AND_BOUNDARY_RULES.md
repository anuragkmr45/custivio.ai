# Folder And Boundary Rules

## Ownership

- `apps/api` owns Fastify app setup, plugins, HTTP routes, OpenAPI exposure, request/response mapping, and API route tests.
- `apps/api/src/workers` owns worker entrypoints and job runners.
- `packages/core` owns business workflows.
- `packages/db` owns Drizzle schema, migrations, repositories, seed scripts, and PostgreSQL clients.
- `packages/auth` owns auth, sessions, users, roles, permissions, and guards.
- `packages/storage` owns MinIO/S3 clients, object keys, checksums, and storage policy helpers.
- `packages/cache` owns Valkey clients, locks, idempotency, queues, and rate limits.
- `packages/config` owns environment parsing. Other packages must not read `process.env`.
- `packages/telemetry` owns logging, metrics, tracing, and request IDs.
- `infra` owns Docker Compose, Dockerfiles, Prometheus, Grafana, OTel, and MinIO config.
- `docs` owns policies, ADRs, QA notes, operation docs, and implementation notes.
- `tests` owns integration and e2e/backend smoke tests spanning more than one package.
- `_cleanup_review` is quarantine only and is not active product source.

## Boundaries

- Fastify routes call core/auth services instead of embedding complex DB logic.
- Fastify routes must not import `@custivio/db`, `@custivio/cache`, `@custivio/storage`, Drizzle, PostgreSQL clients, Valkey clients, or MinIO/S3 clients directly.
- Core services may coordinate DB repositories, auth helpers, storage, cache, and telemetry.
- Core services cannot import app routes or UI/frontend code.
- Only `packages/db` imports Drizzle clients or PostgreSQL clients.
- Only `packages/storage` imports MinIO/S3 SDKs.
- Only `packages/cache` imports Valkey client SDKs.
- Only `packages/config` reads `process.env`.

## Feature Notes

Every feature must create or update `docs/engineering/features/<feature-name>.md` or an active backend-completion document before final acceptance.
