# Reusable Ideas

## Architecture

- Source: FinOpenPOS, `FinOpenPOS/README.md:139`, `FinOpenPOS/README.md:284`
  - Useful: monorepo with app/package boundaries and typed tRPC procedures.
  - Decision: rewrite.
  - Adaptation: use Next.js App Router plus internal service/repository packages; keep Drizzle/Postgres only.
- Source: ce, `ce/README.md:32`, `ce/apps/backend/src/storage/dynamic-storage.adapter.ts:16`
  - Useful: backend module boundaries and adapter-oriented services.
  - Decision: rewrite.
  - Adaptation: use a lighter Next.js service layer unless a separate API worker is introduced later.
- Source: Roomer, `Roomer/README.md:363`
  - Useful: `apps/api`, `apps/web`, `packages/shared` split.
  - Decision: reference.
  - Adaptation: target starts with `apps/web` plus packages; split API only if needed.

## UI/UX

- Source: SAMS, `SAMS/README.md:78`, `SAMS/README.md:84`
  - Useful: asset dashboard, QR, tickets, reports, audit readiness modules.
  - Decision: rewrite.
  - Adaptation: implement as dense operational Next.js screens with shadcn/Radix components.
- Source: Panthora, `panthora/README.md:53`, `panthora/README.md:59`
  - Useful: asset type, tag, and asset organization UX.
  - Decision: rewrite.
  - Adaptation: dynamic forms backed by Drizzle schema and Zod validation.
- Source: Roomer, `Roomer/README.md:21`
  - Useful: floor plan and location visual management.
  - Decision: reference.
  - Adaptation: defer visual floor-plan editor until core location hierarchy is stable.

## Asset Data Model

- Source: Sanchay, `Sanchay/prisma/schema.prisma:118`, `Sanchay/prisma/schema.prisma:221`
  - Useful: hardware categories and subtype-specific attributes.
  - Decision: rewrite.
  - Adaptation: model asset categories/types/custom fields in Drizzle instead of hard-coding every subtype table.
- Source: Panthora, `panthora/packages/app/prisma/schema.prisma:142`, `panthora/packages/app/prisma/schema.prisma:156`, `panthora/packages/app/prisma/schema.prisma:199`
  - Useful: asset types, custom fields, field values.
  - Decision: rewrite.
  - Adaptation: create `asset_types`, `asset_type_fields`, and `asset_field_values` with tenant-scoped constraints.
- Source: chittyassets, `chittyassets/shared/schema.ts:59`, `chittyassets/shared/schema.ts:100`, `chittyassets/shared/schema.ts:123`
  - Useful: evidence and timeline concepts.
  - Decision: rewrite.
  - Adaptation: use `asset_attachments`, `asset_events`, and immutable `audit_logs`.

## Inventory/Stock Model

- Source: Sanchay, `Sanchay/prisma/schema.prisma:399`, `Sanchay/src/lib/utils/notificationLogic.ts:114`
  - Useful: stock accuracy and low-inventory notifications.
  - Decision: rewrite.
  - Adaptation: implement stock ledger, balances, and low-stock rules with transactions and tests.
- Source: FinOpenPOS, `FinOpenPOS/packages/db/src/schema.ts:32`, `FinOpenPOS/apps/web/src/lib/trpc/routers/products.ts:25`
  - Useful: product catalog CRUD and test style.
  - Decision: rewrite.
  - Adaptation: split fixed assets from consumable stock items.

## QR/Barcode Flows

- Source: SAMS, `SAMS/README.md:60`, `SAMS/README.md:61`
  - Useful: one-off and bulk QR generation/export/print history.
  - Decision: rewrite.
  - Adaptation: generate QR payloads from immutable asset IDs and store print jobs.
- Source: Sanchay, `Sanchay/src/hooks/useQRScanner.ts:17`
  - Useful: camera-based scanner hook concept.
  - Decision: rewrite.
  - Adaptation: create browser QR scan component with permission/error states.
- Source: PartPilot, `PartPilot/app/dashboardPage.tsx:28`, `PartPilot/README.md:54`
  - Useful: barcode scanner intake for parts.
  - Decision: avoid copying; rewrite.
  - Adaptation: scanner input maps to asset tag, serial number, or stock SKU.

## Custody/Movement

- Source: Roomer, `Roomer/apps/api/prisma/schema.prisma:369`, `Roomer/apps/api/prisma/schema.prisma:384`
  - Useful: asset user assignments and assignment history.
  - Decision: rewrite.
  - Adaptation: create custody assignments, movement events, check-in/check-out, and transfer approvals.
- Source: Sanchay, `Sanchay/prisma/schema.prisma:342`, `Sanchay/prisma/schema.prisma:356`
  - Useful: location and assignment history concepts.
  - Decision: rewrite.
  - Adaptation: normalize movement history as append-only events.

## Maintenance

- Source: SAMS, `SAMS/README.md:65`, `SAMS/src/services/tickets.ts:29`
  - Useful: maintenance ticket lifecycle and events.
  - Decision: rewrite.
  - Adaptation: add `maintenance_tickets`, `maintenance_events`, SLA fields, and attachment support.
- Source: Sanchay, `Sanchay/prisma/schema.prisma:195`, `Sanchay/src/lib/utils/notificationLogic.ts:65`
  - Useful: scheduled maintenance notification.
  - Decision: rewrite.
  - Adaptation: scheduled jobs via Valkey/Postgres job table.

## Audit/Compliance

- Source: SAMS, `SAMS/src/services/audit.ts:34`, `SAMS/src/services/audit.ts:110`, `SAMS/src/services/audit.ts:365`
  - Useful: audit sessions, assignments, reviews, submissions, reports.
  - Decision: rewrite.
  - Adaptation: implement audit campaigns, scoped assignments, immutable submissions, and exports.
- Source: Roomer, `Roomer/apps/api/prisma/schema.prisma:616`
  - Useful: audit log table concept.
  - Decision: rewrite.
  - Adaptation: global immutable audit log for every sensitive mutation.

## Import/Export

- Source: Roomer, `Roomer/README.md:27`, `Roomer/apps/api/src/routes/import.ts:58`
  - Useful: bulk CSV import endpoint for locations/assets.
  - Decision: rewrite.
  - Adaptation: CSV/XLSX preview, validation, background processing, idempotency.
- Source: SAMS, `SAMS/README.md:71`, `SAMS/README.md:84`
  - Useful: downloadable report/export UX.
  - Decision: rewrite.
  - Adaptation: exports become jobs with files stored in MinIO.

## Reporting

- Source: FinOpenPOS, `FinOpenPOS/apps/web/src/lib/trpc/routers/dashboard.ts:8`
  - Useful: typed dashboard stats route.
  - Decision: rewrite.
  - Adaptation: expose dashboard service with permission-filtered metrics.
- Source: Sanchay, `Sanchay/src/components/reports/AdminInventoryReport.tsx:49`
  - Useful: inventory report composition.
  - Decision: rewrite.
  - Adaptation: Recharts/dashboard panels plus CSV/PDF export jobs.

## Auth/RBAC

- Source: ce, `ce/apps/backend/src/permissions/permissions.service.spec.ts:677`
  - Useful: tests for direct plus group permission aggregation.
  - Decision: rewrite.
  - Adaptation: tenant/site/department-scoped permissions with matrix tests.
- Source: Roomer, `Roomer/README.md:29`, `Roomer/apps/api/prisma/schema.prisma:497`
  - Useful: global and resource roles.
  - Decision: rewrite.
  - Adaptation: roles, permissions, assignments, resource scopes.
- Source: FinOpenPOS, `FinOpenPOS/README.md:284`
  - Useful: all API procedures protected by session cookie.
  - Decision: rewrite.
  - Adaptation: protected server actions/route handlers with shared permission helpers.

## Storage/Attachments

- Source: dashboard-boilerplate, `dashboard-boilerplate/README.md:120`, `dashboard-boilerplate/next-app/src/services/minio.ts:1`
  - Useful: MinIO via S3-compatible AWS SDK.
  - Decision: rewrite.
  - Adaptation: package `storage` with safe object-key helpers and permission checks.
- Source: ce, `ce/apps/backend/src/storage/minio.adapter.ts`, `ce/apps/backend/src/storage/dynamic-storage.adapter.ts:42`
  - Useful: adapter tests and storage migration concepts.
  - Decision: rewrite.
  - Adaptation: target supports MinIO only initially; keep interface small.

## Docker/Devops

- Source: dashboard-boilerplate, `dashboard-boilerplate/docker-compose.yml:56`, `dashboard-boilerplate/docker-compose.yml:81`
  - Useful: simple Postgres/MinIO compose.
  - Decision: rewrite.
  - Adaptation: add Valkey, Mailpit, Prometheus, Grafana, OTel collector.
- Source: ce, `ce/docker-compose.yml:112`, `ce/docker-compose.yml:161`, `ce/docker-compose.yml:244`
  - Useful: service profiles and health checks.
  - Decision: rewrite.
  - Adaptation: use Valkey instead of Redis and keep services local-first.
- Source: Roomer, `Roomer/docker-compose.yml:68`, `Roomer/apps/api/src/app.ts:240`
  - Useful: health dependencies and probes.
  - Decision: rewrite.
  - Adaptation: `/api/health/live`, `/api/health/ready`, `/api/metrics`.

## Testing

- Source: FinOpenPOS, `FinOpenPOS/README.md:308`
  - Useful: router and domain tests.
  - Decision: rewrite.
  - Adaptation: unit/integration tests for services and server actions.
- Source: ce, `ce/apps/backend/src/permissions/permissions.service.spec.ts:36`, `ce/apps/backend/src/storage/minio.adapter.spec.ts`
  - Useful: permission/storage tests.
  - Decision: rewrite.
  - Adaptation: test tenant isolation, permission matrix, storage object-key safety.
- Source: Panthora, `panthora/packages/app/tests/e2e/assetTypeTable.spec.ts`
  - Useful: E2E coverage for asset type UX.
  - Decision: rewrite.
  - Adaptation: Playwright flows for asset type creation and asset CRUD.

## Observability

- Source: Roomer, `Roomer/apps/api/src/app.ts:240`, `Roomer/apps/api/src/app.ts:268`, `Roomer/README.md:292`
  - Useful: health and Prometheus metrics endpoints.
  - Decision: rewrite.
  - Adaptation: add live/ready/metrics routes in Next.js with DB/Valkey/MinIO checks.
- Source: ce, `ce/apps/backend/src/app.controller.ts:13`, `ce/apps/backend/src/main.ts:44`
  - Useful: health endpoint and API docs discipline.
  - Decision: reference.
  - Adaptation: document routes and include request IDs/logging.

