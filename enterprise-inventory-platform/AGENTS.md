# AGENTS.md - Enterprise Inventory Platform

This file is the operating manual for agents and developers working in this repository.

## Product Identity

Project name: `enterprise-inventory-platform`

Purpose: build an enterprise-grade on-prem and air-gapped inventory and IT asset management platform for computers, laptops, servers, network devices, racks, cables, chips, components, spares, consumables, accessories, licenses, warranty records, maintenance records, audit evidence, import/export files, and reports.

## Target Stack

Use only:

- Next.js App Router, React, and TypeScript.
- PostgreSQL with Drizzle ORM.
- Valkey for cache, queues, locks, idempotency, and rate limits.
- MinIO or another S3-compatible object store for attachments.
- Docker Compose for local development dependencies.
- OpenTelemetry, Prometheus, and Grafana for observability.
- Zod or equivalent runtime validation.
- Tailwind CSS, shadcn/ui, and Radix UI for the web app.

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
- Default application admin credentials.
- Demo authentication persisted in localStorage.

The audit in `../repo-audit/` is reference material only. Do not copy source code from audited repositories.

## Folder Ownership

- `apps/web` owns Next.js routes, layouts, route handlers, server actions, and UI composition.
- `packages/core` owns business workflows and calls repositories, auth guards, storage, cache, and telemetry.
- `packages/db` owns Drizzle schema, migrations, seed scripts, repository functions, and PostgreSQL clients.
- `packages/auth` owns sessions, permission checks, roles, users, and auth guards.
- `packages/storage` owns MinIO/S3 clients, object keys, and storage policies.
- `packages/cache` owns Valkey clients, locks, rate limits, idempotency, and queues.
- `packages/config` owns environment validation. Only this package may read `process.env`.
- `packages/telemetry` owns logging, request IDs, metrics, and tracing helpers.
- `infra` owns local development infrastructure only.
- `docs` owns ADRs, QA notes, and engineering policies.
- `tests` owns cross-package integration and e2e tests.

## Import Boundaries

- UI/client components must not import database clients, Drizzle, `pg`, MinIO/S3 clients, Valkey clients, or Node-only APIs.
- Next.js route handlers and server actions should call `packages/core` services instead of embedding complex DB logic.
- `packages/core` must not import React, Next.js UI code, or app components.
- Only `packages/db` may import Drizzle client packages or low-level PostgreSQL clients.
- Only `packages/storage` may construct MinIO object keys or call S3-compatible object APIs.
- Only `packages/cache` may create Valkey connections.

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

## API And Backend Rules

Every protected mutation must:

1. Validate input.
2. Resolve current session and tenant context.
3. Check permissions.
4. Use a transaction when changing more than one table.
5. Write an audit log.
6. Return typed results or typed errors.
7. Hide raw database errors.
8. Include request ID in logs and error responses.
9. Use idempotency keys for repeated or long-running operations.

## Testing Rules

Every phase must run or document why it could not run:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test`
- `pnpm check:forbidden`
- Migration test on an empty PostgreSQL database when schema changes.
- Seed idempotency test when seed data changes.
- Docker Compose startup test when infrastructure changes.

## Feature Implementation Workflow

Before implementing a feature:

1. Identify the owning module.
2. Identify affected packages and folders.
3. Identify DB tables and migrations.
4. Identify API handlers or server actions.
5. Identify UI screens and components.
6. Identify unit, integration, and e2e tests.
7. Identify manual QA checks.
8. Identify migration and backward compatibility risks.
9. Confirm no forbidden dependency is needed.
10. Create or update `docs/engineering/features/<feature-name>.md`.

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
