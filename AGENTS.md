# AGENTS.md - Custivio Workspace

This file is the operating manual for agents and developers working in this workspace.

## Product Identity

Project name: `custivio`

Custivio is a production-grade on-prem and air-gapped inventory and IT asset management platform for computers, laptops, servers, network devices, racks, cables, chips, components, spares, consumables, accessories, licenses, warranty records, maintenance records, audit evidence, import files, export files, and reports.

## Workspace Layout

```text
custivio/              Backend, database, infra, deployment, tests, and backend docs.
custivio-web/          Frontend React/TanStack UI.
custivio-docs/         Curated engineering, deployment, support, pre-sales, post-sales, and QA docs.
shared-observability/  Reusable internal observability stack and org target templates.
```

## Non-Negotiable Stack

Use only approved local-first platform components for core workflows:

- React, TypeScript, Tailwind CSS, shadcn/ui, and Radix UI for frontend UI.
- Fastify on Node.js for the active backend API.
- PostgreSQL with Drizzle ORM.
- Valkey for cache, queues, locks, idempotency, and rate limits.
- MinIO or S3-compatible object storage for attachments, exports, and audit evidence.
- Docker Compose for local and deployment dependencies.
- OpenTelemetry, Prometheus, and Grafana.
- Zod, JSON Schema, or equivalent runtime validation.

Do not add:

- Prisma.
- Supabase runtime dependencies.
- Firebase.
- MongoDB or Mongoose.
- Neon or serverless-only PostgreSQL runtime dependencies.
- Paid SaaS dependencies for core workflows.
- Local filesystem as production attachment storage.
- Default production admin credentials.
- Demo or localStorage auth persistence.

## Agent Rules

Before implementing a feature:

1. Identify the module.
2. Identify affected packages and folders.
3. Identify database tables and migrations.
4. Identify API routes, worker entrypoints, or frontend screens.
5. Identify tests and manual QA.
6. Identify migration and backward compatibility risks.
7. Confirm no forbidden dependency is needed.
8. Update the relevant docs under `custivio-docs/` and source repo docs when behavior changes.

Do not copy source code from external audit/reference repositories.

## Done Definition

A task is done only when:

- Code compiles.
- Lint passes or the failure is reported with a concrete blocker.
- Tests are added or updated where behavior changed.
- Migrations exist when schema changed.
- Documentation is updated.
- Forbidden dependency checks pass.
- Files stay inside the agreed Custivio workspace folders.
