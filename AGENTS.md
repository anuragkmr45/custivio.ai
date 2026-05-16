# AGENTS.md — Enterprise Inventory Platform

This file is the operating manual for Codex/AI agents and developers working on this repository.

## Product identity

Project name: `enterprise-inventory-platform`

Purpose: build an enterprise-grade on-prem / air-gapped inventory and IT asset management platform for:

- computers
- laptops
- servers
- network devices
- racks
- cables
- chips/components
- spares
- consumables
- accessories
- licenses
- warranty/maintenance records
- audit evidence
- import/export/report files

## Non-negotiable target stack

Use only:

- Next.js App Router
- React
- TypeScript
- PostgreSQL
- Drizzle ORM
- Valkey
- MinIO/S3-compatible object storage
- Docker Compose for local/dev dependencies
- OpenTelemetry, Prometheus, Grafana
- Zod or equivalent validation
- Tailwind CSS + shadcn/ui/Radix UI

Do not add:

- Prisma
- Supabase runtime dependency
- Firebase
- MongoDB
- Neon/serverless-only DB runtime
- paid SaaS dependency for core workflows
- local filesystem as production attachment storage
- unapproved AGPL/Elastic/O'Saasy code copying
- default admin credentials
- demo/localStorage auth persistence

## Agent behavior rules

When the user gives a feature request, do not start coding immediately. First:

1. Identify the module.
2. Identify affected packages/folders.
3. Identify database tables/migrations.
4. Identify API/server actions.
5. Identify UI screens/components.
6. Identify tests.
7. Identify QA/manual testing.
8. Identify migration/backward compatibility risks.
9. Confirm no forbidden dependency is needed.
10. Then implement only the requested phase/scope.

If something is unclear, make a safe assumption and document it in `docs/DECISIONS.md` unless the ambiguity can break data integrity or security.

## Repository structure

Expected structure:

```text
enterprise-inventory-platform/
  apps/
    web/
      app/
      components/
      features/
      lib/
      middleware.ts
  packages/
    db/
      src/
        schema/
        repositories/
        migrations/
        seed/
        client.ts
        migrate.ts
    core/
      src/
        assets/
        catalog/
        inventory/
        locations/
        custody/
        maintenance/
        audit/
        imports/
        exports/
        reports/
    auth/
      src/
        guards/
        permissions/
        sessions/
        users/
    storage/
      src/
        minio-client.ts
        object-keys.ts
        policies.ts
    cache/
      src/
        valkey-client.ts
        locks.ts
        rate-limit.ts
        idempotency.ts
    config/
      src/
        env.ts
    telemetry/
      src/
        logger.ts
        metrics.ts
        tracing.ts
        request-id.ts
  infra/
    docker-compose.dev.yml
    prometheus/
    grafana/
    otel/
    minio/
  docs/
    ADR/
    QA/
    engineering/
  tests/
    integration/
    e2e/
```

## Import boundary rules

### UI/client code

Files under:

```text
apps/web/components/**
apps/web/features/**/components/**
```

must not import:

- `packages/db`
- database clients
- Drizzle client
- `pg`
- `postgres`
- MinIO/S3 clients directly
- Valkey clients directly
- Node-only APIs such as `fs`, `path`, `crypto` unless inside server-only files

Client components must call UI actions/hooks that eventually use server actions or route handlers.

### Next.js route handlers and server actions

Route handlers/server actions may import:

- `packages/core`
- `packages/auth`
- `packages/config`
- `packages/telemetry`

They must not directly write complex DB logic. Use core services.

### Core services

`packages/core` owns business workflows.

Core services may call:

- repositories from `packages/db`
- permission helpers from `packages/auth`
- storage services from `packages/storage`
- cache/idempotency helpers from `packages/cache`
- logger/tracing from `packages/telemetry`

Core services must not import React or UI components.

### Database package

`packages/db` owns:

- Drizzle schema
- migrations
- repository functions
- seed scripts
- transaction helpers

Only `packages/db` should import Drizzle client and low-level PostgreSQL clients.

### Storage package

`packages/storage` owns MinIO object key creation and object operations. No other package should manually construct MinIO object keys.

### Cache package

`packages/cache` owns Valkey connections, locks, rate limits, idempotency, and queue primitives.

## Database change rules

For any database change:

1. Update schema in `packages/db/src/schema`.
2. Add/modify repository function.
3. Generate Drizzle migration.
4. Add tests for constraints and repository behavior.
5. Update seed if required.
6. Update docs if table/domain meaning changes.
7. Do not edit generated migration by guesswork unless necessary and documented.
8. Never drop/rename columns without migration notes and backward compatibility review.
9. Add tenant isolation to every tenant-owned table.
10. Add indexes for tenant, status, type, location, custodian, serial, asset tag, SKU, and date filters as appropriate.

## API/backend rules

Every protected mutation must:

1. Validate input.
2. Resolve current user/session.
3. Resolve tenant context.
4. Check permission.
5. Run inside transaction if it changes more than one table.
6. Write audit log.
7. Return typed result or typed error.
8. Never expose raw DB errors.
9. Include request ID in error response/log.
10. Use idempotency key for repeated or long-running operations.

## Testing rules

Every phase must pass:

- typecheck
- lint
- format check
- unit tests
- integration tests for changed modules
- no forbidden dependency check
- migration test on empty PostgreSQL
- seed idempotency test when seed changes
- Docker Compose startup test when infra changes

## Feature implementation format

For every feature, create/update a short implementation note:

```text
docs/engineering/features/<feature-name>.md
```

Required sections:

- Requirement
- Scope
- Out of scope
- Affected folders
- DB changes
- API/server actions
- UI screens
- Permission rules
- Audit log rules
- Tests
- Manual QA checklist
- Rollback/migration notes
```

## Done definition

A task is not done until:

- code compiles
- lint passes
- tests are added/updated
- migration is present if schema changed
- documentation is updated
- forbidden dependency check passes
- manual QA checklist is written
- no files are placed outside agreed folders
