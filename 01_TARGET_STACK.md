# Target Stack and Architecture Decision Record

## Final target stack

### Frontend / full-stack app

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or Radix UI primitives
- TanStack Query only if API is separated from server actions/tRPC
- Zod or Valibot for validation
- Recharts for dashboards

### Backend options

Preferred option:

- Next.js full-stack app with route handlers/server actions
- Separate service layer inside `packages/core`
- Drizzle-based repository layer inside `packages/db`

Optional enterprise option:

- `apps/web`: Next.js frontend
- `apps/api`: Fastify or Hono API service
- `packages/db`: Drizzle schema and migrations
- `packages/core`: business logic
- `packages/auth`: auth and RBAC utilities
- `packages/config`: env schema and shared config

Use separate API service only if you need independent scaling, background workers or strict API boundaries.

### Database

- PostgreSQL only
- Drizzle ORM
- Drizzle Kit migrations
- `node-postgres` / `pg` or `postgres.js`
- No Prisma
- No MongoDB
- No Firebase
- No Supabase dependency in final production architecture
- Enable extensions if required:
  - `uuid-ossp` or `pgcrypto`
  - `pg_trgm` for fuzzy search
  - `btree_gin`
  - optional `vector` only if semantic search is needed later

### Cache / queue / locking

- Valkey
- Prefer official Valkey GLIDE Node.js client where practical
- Use Valkey for:
  - session/cache acceleration
  - rate limiting
  - distributed locks
  - job queue coordination
  - temporary import state
  - idempotency keys
  - presence/notifications if needed

### File/object storage

- MinIO
- S3-compatible API
- Store original files and generated variants
- Store only metadata in PostgreSQL
- Object key pattern:
  - `tenant/{tenantId}/asset/{assetId}/attachments/{uuid}/{filename}`
  - `tenant/{tenantId}/imports/{importJobId}/{filename}`
  - `tenant/{tenantId}/exports/{exportJobId}/{filename}`

### Background jobs

Preferred:

- PostgreSQL-backed jobs for simple workflows, or
- Valkey-backed queue if high-volume async jobs are required

Jobs required:

- CSV/XLSX import processing
- QR/label bulk generation
- report export
- attachment thumbnail/metadata extraction
- warranty-expiry alerts
- asset audit reminders
- scheduled backup verification

### Observability

- OpenTelemetry instrumentation
- Prometheus metrics endpoint
- Grafana dashboards
- Loki-compatible logs if available
- Tempo-compatible traces if available
- Health endpoints:
  - `/api/health/live`
  - `/api/health/ready`
  - `/api/metrics`

### Dev Docker Compose services

Minimum dev services:

- postgres
- valkey
- minio
- minio-init bucket setup
- mailpit
- prometheus
- grafana
- otel-collector

Optional:

- loki
- tempo
- adminer/pgadmin
- minio console
- local antivirus scanning container for uploaded files

---

## Proposed monorepo structure

```text
inventory-platform/
  apps/
    web/
      app/
      components/
      features/
      lib/
      middleware.ts
      next.config.ts
  packages/
    db/
      src/
        schema/
        migrations/
        seed/
        client.ts
        migrate.ts
    core/
      src/
        assets/
        inventory/
        locations/
        custody/
        maintenance/
        audit/
        imports/
        exports/
    auth/
      src/
        permissions.ts
        roles.ts
        policy.ts
    storage/
      src/
        minio.ts
        object-keys.ts
    cache/
      src/
        valkey.ts
        locks.ts
        rate-limit.ts
    config/
      src/
        env.ts
    telemetry/
      src/
        metrics.ts
        tracing.ts
  tests/
    e2e/
    integration/
    fixtures/
  infra/
    docker-compose.dev.yml
    prometheus/
    grafana/
    otel/
    minio/
  docs/
    ADR/
    QA/
    USER-FLOWS/
```

---

## Core domain modules

### 1. Tenant and organization

- tenants
- organizations
- departments
- sites
- buildings
- floors
- rooms
- racks
- shelves/bins

### 2. Users and access control

- users
- roles
- permissions
- role assignments
- department/site-scoped permissions
- audit of permission changes

### 3. Asset catalog

- asset categories
- asset types
- asset templates
- custom fields
- manufacturers
- models
- vendors
- warranty providers

### 4. Assets

- assets
- serial numbers
- asset tags
- QR/barcode values
- status
- condition
- owner/custodian
- current location
- purchase details
- warranty details
- lifecycle dates
- attachments

### 5. Inventory/stock

- stock items
- units of measure
- consumables
- cables
- spares
- chips/components
- bins
- stock ledger
- stock adjustments
- stock transfers
- minimum stock alerts

### 6. Custody and movement

- check-out
- check-in
- issue/return
- transfer requests
- approval workflow
- movement history
- handover forms

### 7. Maintenance

- tickets
- preventive maintenance schedules
- repair logs
- vendor repair
- downtime tracking
- replacement history

### 8. Audit

- audit campaigns
- asset verification
- physical count
- missing/damaged findings
- auditor remarks
- signed audit evidence
- immutable audit log

### 9. Imports/exports

- CSV/XLSX import templates
- validation previews
- bulk upload jobs
- export jobs
- report generation

### 10. Reports and dashboards

- asset count by status/location/type
- warranty expiry
- assigned vs unassigned
- movement history
- stock low alerts
- maintenance backlog
- audit compliance
- lost/damaged assets
- lifecycle value summary
