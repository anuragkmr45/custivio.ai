# Target Architecture

## Summary

Build a fresh `enterprise-inventory-platform` monorepo. Do not merge source code from audited repos. Use the audited repos only as evidence-backed references for patterns and workflows.

## Stack

- Next.js App Router, React, TypeScript.
- Tailwind CSS plus shadcn/ui or Radix primitives.
- Drizzle ORM with PostgreSQL only.
- Valkey for cache, queues, locks, rate limits, idempotency, and temporary import state.
- MinIO via S3-compatible API for attachments/imports/exports.
- Docker Compose for all local/dev dependencies.
- OpenTelemetry, Prometheus, Grafana, structured logs, request IDs.

## Monorepo Shape

```text
enterprise-inventory-platform/
  apps/web/
  packages/db/
  packages/core/
  packages/auth/
  packages/storage/
  packages/cache/
  packages/config/
  packages/telemetry/
  infra/docker/
  infra/prometheus/
  infra/grafana/
  infra/otel/
  docs/ADR/
  docs/QA/
  tests/e2e/
  tests/integration/
```

## Runtime Boundaries

- `apps/web`: Next.js UI, route handlers, server actions, middleware.
- `packages/core`: domain services for assets, inventory, custody, maintenance, audits, imports, exports, reports.
- `packages/db`: Drizzle schema, migrations, repository helpers, seed.
- `packages/auth`: session, password policy, role/permission matrix, tenant/site/department scope checks.
- `packages/storage`: MinIO client, object keys, upload/download/delete policies.
- `packages/cache`: Valkey client, locks, rate limits, queue primitives, idempotency.
- `packages/config`: Zod environment validation.
- `packages/telemetry`: logger, request IDs, metrics, tracing bootstrap.

## Non-Negotiable Constraints

- No Prisma, Supabase, Firebase, MongoDB, Neon/serverless-only DB runtime, or paid SaaS core dependency.
- No direct AGPL/Elastic/O'Saasy code copying without legal approval.
- No local filesystem as production attachment storage.
- No unscoped cross-tenant queries.

