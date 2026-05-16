# Folder And Boundary Rules

## Ownership

- `apps/web` owns Next.js UI, route handlers, server actions, and middleware.
- `packages/core` owns business workflows.
- `packages/db` owns Drizzle schema, migrations, repositories, and PostgreSQL clients.
- `packages/auth` owns auth, sessions, users, roles, permissions, and guards.
- `packages/storage` owns MinIO/S3 clients, object keys, and storage policy helpers.
- `packages/cache` owns Valkey clients, locks, idempotency, queues, and rate limits.
- `packages/config` owns environment parsing. Other packages must not read `process.env`.
- `packages/telemetry` owns logging, metrics, tracing, and request IDs.
- `infra` owns local development infrastructure.
- `docs` owns policies, ADRs, QA notes, and implementation notes.
- `tests` owns integration and e2e tests spanning more than one package.

## Boundaries

- UI/client components cannot import DB, cache, storage, or Node-only APIs.
- Route handlers call core services rather than embedding complex DB logic.
- Core services cannot import React, Next.js UI, or app code.
- Only `packages/db` imports Drizzle clients or PostgreSQL clients.
- Only `packages/storage` imports MinIO/S3 SDKs.
- Only `packages/cache` imports Valkey client SDKs.

## Feature Notes

Every feature must create or update `docs/engineering/features/<feature-name>.md` before final acceptance.
