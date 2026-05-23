# AGENTS.md - Custivio Backend

This file is the operating manual for agents and developers working in this repository.

## Product Identity

Project name: `custivio`

Purpose: build an production-grade on-prem and air-gapped inventory and IT asset management backend for computers, laptops, servers, network devices, racks, cables, chips, components, spares, consumables, accessories, licenses, warranty records, maintenance records, audit evidence, import/export files, and reports.

This repository is backend, database, infrastructure, deployment, observability, and test automation only. Frontend UI code lives outside this backend repo.

## Target Stack

Use only:

- Fastify on Node.js with TypeScript.
- PostgreSQL with Drizzle ORM.
- Valkey for cache, queues, locks, idempotency, rate limits, and workers.
- MinIO or another S3-compatible object store for attachments and exports.
- Docker Compose for local, staging, and on-prem deployment dependencies.
- OpenTelemetry, Prometheus, and Grafana for observability.
- Zod, JSON Schema, or comparable runtime validation.

## Forbidden Dependencies And Patterns

Do not add:

- Prisma or `@prisma/client`.
- Supabase runtime dependencies.
- Firebase.
- MongoDB, Mongoose, or document-database runtime dependencies.
- Neon or serverless-only PostgreSQL runtime dependencies.
- Paid SaaS dependencies for core workflows.
- Production attachment storage on the local filesystem.
- Unapproved AGPL, Elastic, or O'Saasy code copying.
- Default production admin credentials.
- Demo authentication persisted in localStorage.
- Next.js, React, Tailwind, Radix, or frontend-only runtime dependencies in active product packages.

Do not copy source code from external audit or reference repositories.

## Folder Ownership

- `apps/api` owns the Fastify HTTP server, plugins, route handlers, request/response mapping, OpenAPI exposure, and API tests.
- `apps/api/src/workers` owns backend worker entrypoints and job runners.
- `packages/core` owns business workflows and calls repositories, auth guards, storage, cache, and telemetry.
- `packages/db` owns Drizzle schema, migrations, seed scripts, repository functions, and PostgreSQL clients.
- `packages/auth` owns sessions, permission checks, roles, users, and auth guards.
- `packages/storage` owns MinIO/S3 clients, object keys, checksums, and storage policies.
- `packages/cache` owns Valkey clients, locks, rate limits, idempotency, and queues.
- `packages/config` owns environment validation. Only this package may read `process.env`.
- `packages/telemetry` owns logging, request IDs, metrics, and tracing helpers.
- `infra` owns Docker, Prometheus, Grafana, OTel, MinIO, and deployment config.
- `docs` owns ADRs, QA notes, operation docs, and engineering policies.
- `tests` owns cross-package integration and e2e/backend smoke tests.

## Import Boundaries

- Fastify route handlers must call `packages/core`, `packages/auth`, `packages/config`, and `packages/telemetry`; they must not embed complex DB logic.
- Route handlers must not import `@custivio/db`, `@custivio/cache`, `@custivio/storage`, Drizzle, PostgreSQL clients, Valkey clients, or MinIO/S3 clients directly.
- `packages/core` may call repositories from `packages/db`, auth helpers from `packages/auth`, storage helpers from `packages/storage`, cache helpers from `packages/cache`, and telemetry helpers from `packages/telemetry`.
- `packages/core` must not import app routes, Fastify app internals, or UI/front-end code.
- Only `packages/db` may import Drizzle clients or low-level PostgreSQL clients.
- Only `packages/storage` may construct MinIO object keys or call S3-compatible object APIs.
- Only `packages/cache` may create Valkey connections.
- Only `packages/config` may read `process.env`.

## Database Rules

For every database change:

1. Update Drizzle schema under `packages/db/src/schema`.
2. Add or update repository functions.
3. Generate a Drizzle migration.
4. Add tests for constraints and repository behavior.
5. Update seed data only when required.
6. Add tenant isolation to tenant-owned tables.
7. Add indexes for tenant, status, type, location, custodian, serial, asset tag, SKU, and date filters as appropriate.
8. Never drop or rename columns without migration notes and backward compatibility review.
9. Keep audit/event tables append-only unless an ADR explicitly permits retention cleanup.

## API And Backend Rules

Every protected mutation must:

1. Validate input.
2. Resolve current session and tenant context.
3. Check permissions.
4. Use a transaction when changing more than one table.
5. Write an audit log.
6. Return typed results or typed errors.
7. Hide raw database and storage errors.
8. Include request ID in logs and error responses.
9. Use idempotency keys for repeated or long-running operations.
10. Emit metrics for important business and dependency outcomes where practical.

## Worker Rules

- Workers must use Valkey queues, locks, idempotency keys, retry tracking, and dead-letter behavior.
- Workers must be safe to run more than one process.
- Job status must be visible through backend APIs.
- Import/export workers must not bypass tenant, permission, audit, storage, or telemetry rules.

## Testing Rules

Every phase must run or document why it could not run:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test`
- `pnpm test:api`
- `pnpm check:forbidden`
- Migration test on PostgreSQL when schema changes.
- Seed idempotency test when seed data changes.
- Docker Compose startup test when infrastructure changes.
- Production Compose config validation when deployment files change.

## Feature Implementation Workflow

Before implementing a feature:

1. Identify the owning module.
2. Identify affected packages and folders.
3. Identify DB tables and migrations.
4. Identify API routes or worker entrypoints.
5. Identify tests and manual QA checks.
6. Identify migration and backward compatibility risks.
7. Confirm no forbidden dependency is needed.
8. Create or update `docs/engineering/features/<feature-name>.md` or a backend-completion note.

## Done Definition

A task is done only when:

- Code compiles.
- Lint passes.
- Tests are added or updated.
- Migrations exist when schema changed.
- Documentation is updated.
- Forbidden dependency checks pass.
- Manual QA checklist is written.
- Files are placed inside agreed folders.
- `docs/engineering/backend-completion/BACKEND_COMPLETION_TASK_BOARD.md` and `TEST_RUN_LOG.md` are updated when backend completion work changes.
