# Codex Prompt — Phase 1 Implementation

Use only after the audit phase is complete.

---

## Role

You are implementing Phase 1 of a new enterprise-grade on-prem inventory and IT asset management platform.

## Hard constraints

- Do not use Prisma.
- Do not use Supabase.
- Do not use Firebase.
- Do not use MongoDB.
- Do not use Neon/serverless-only DB config.
- Do not add paid SaaS dependencies.
- Use PostgreSQL only for database.
- Use Drizzle ORM only.
- Use Valkey for cache/locks/rate limits/queue readiness.
- Use MinIO for file/object storage.
- Keep the project air-gap friendly.
- All dev dependencies must run in Docker Compose.

## Goal

Create the fresh project scaffold for:

```text
enterprise-inventory-platform
```

## Required output structure

```text
enterprise-inventory-platform/
  apps/
    web/
  packages/
    db/
    core/
    auth/
    storage/
    cache/
    config/
    telemetry/
  infra/
    docker/
    prometheus/
    grafana/
    otel/
    minio/
  docs/
    ADR/
    QA/
  tests/
```

## Implementation tasks

### 1. Project setup

- Create workspace package configuration.
- Add TypeScript.
- Add linting.
- Add formatting.
- Add test runner.
- Add root scripts:
  - `dev`
  - `build`
  - `typecheck`
  - `lint`
  - `format`
  - `test`
  - `db:generate`
  - `db:migrate`
  - `db:seed`
  - `docker:dev`

### 2. Next.js app

- Create `apps/web`.
- Add App Router.
- Add basic dashboard shell.
- Add `/api/health/live`.
- Add `/api/health/ready`.
- Add `/api/metrics` placeholder or metrics route.
- Add environment validation.

### 3. PostgreSQL + Drizzle

- Create `packages/db`.
- Add Drizzle config.
- Add database client.
- Add basic schema:
  - tenants
  - users
  - audit_logs
- Add initial migration.
- Add seed script.

### 4. Valkey

- Create `packages/cache`.
- Add Valkey client wrapper.
- Add `pingValkey()` function.
- Add lock utility skeleton.
- Add rate-limit utility skeleton.

### 5. MinIO

- Create `packages/storage`.
- Add S3-compatible MinIO client wrapper.
- Add bucket config.
- Add `putObject`, `getObject`, `deleteObject` skeletons.
- Add safe object key helper.

### 6. Config

- Create `packages/config`.
- Add env schema.
- Add `.env.example`.
- Validate required variables at startup.

### 7. Telemetry

- Create `packages/telemetry`.
- Add structured logger.
- Add OpenTelemetry bootstrap placeholder.
- Add request ID utility.

### 8. Docker Compose

Create dev Docker Compose with:

- postgres
- valkey
- minio
- minio-init
- mailpit
- prometheus
- grafana
- otel-collector

### 9. Documentation

Create:

- `README.md`
- `docs/ADR/0001-target-stack.md`
- `docs/QA/phase-1-checklist.md`

## Done criteria

- Install works.
- Docker Compose starts.
- PostgreSQL is reachable.
- Valkey is reachable.
- MinIO bucket is created.
- App starts.
- `/api/health/live` returns OK.
- `/api/health/ready` checks DB, Valkey and MinIO.
- Typecheck passes.
- Lint passes.
- Tests pass.
- No Prisma dependency exists.
- No Supabase dependency exists.
- No cloud-only dependency exists.

## After implementation

Print:

1. Files created.
2. Commands to run.
3. Verification checklist.
4. Known gaps.
5. Next prompt for Phase 2.
