# Backend Blocker Fix Plan

Source: `docs/engineering/BACKEND_INFRA_DB_SHIP_READINESS_AUDIT.md`.

These blockers should be fixed during or immediately after the Fastify parity migration. They are not implemented by this plan.

## Blocker 1: Authorized File Download And Delete Flows

Current evidence:

- Upload route exists at `apps/web/app/api/assets/[id]/attachments/route.ts`.
- Upload service exists in `packages/core/src/assets/asset-service.ts` as `uploadAssetAttachmentForSession`.
- Storage helper exists in `packages/storage/src/minio-client.ts` as `putObject`.
- Object keys exist in `packages/storage/src/object-keys.ts`.
- No `GetObject`, presign, delete, soft-delete, download route, size limit, or MIME allowlist was found.

Implementation tasks:

1. Add storage helpers in `packages/storage/src/minio-client.ts`:
   - `getObjectStream` or bounded `getObjectBuffer`
   - `createPresignedGetUrl` only if temporary URLs are desired
   - `deleteObject`
   - typed `StorageError`
2. Add object policy helpers in `packages/storage/src/policies.ts`:
   - allowed MIME list
   - max upload size
   - safe content-disposition filename handling
   - checksum placeholder
3. Add DB repository functions in `packages/db/src/repositories/assets.repository.ts`:
   - find attachment by tenant and ID
   - mark attachment deleted or archived
4. Add core service functions in `packages/core/src/assets/asset-service.ts`:
   - `getAssetAttachmentForSession`
   - `createAssetAttachmentDownloadForSession` or `streamAssetAttachmentForSession`
   - `deleteAssetAttachmentForSession`
5. Add Fastify routes:
   - `GET /api/assets/{id}/attachments/{attachmentId}`
   - `DELETE /api/assets/{id}/attachments/{attachmentId}`
   - optional `GET /api/reports/exports/{id}/download`
6. Tests:
   - authorized download succeeds
   - wrong tenant denied
   - missing permission denied
   - unsafe filename is sanitized
   - oversize upload rejected
   - disallowed MIME rejected
   - delete is audited and prevents later download

Acceptance criteria:

- Files are never read from or written to the local production filesystem.
- Download/delete require session, tenant match, and permission.
- Error responses follow the standard error shape.
- Audit logs are written for upload and delete.

## Blocker 2: Valkey Locks, Idempotency, Queues, And Jobs

Current evidence:

- Valkey client exists in `packages/cache/src/valkey-client.ts`.
- Health check exists in `packages/cache/src/index.ts`.
- Rate limit exists in `packages/cache/src/rate-limit.ts`.
- Login rate-limit service exists in `packages/core/src/security/rate-limit-service.ts`.
- No `locks.ts`, `idempotency.ts`, `queue.ts`, worker package, or retry primitive was found.

Implementation tasks:

1. Add `packages/cache/src/locks.ts`:
   - `acquireLock`
   - `releaseLock`
   - fencing token or owner token
   - TTL and retry configuration
2. Add `packages/cache/src/idempotency.ts`:
   - `getIdempotencyResult`
   - `reserveIdempotencyKey`
   - `storeIdempotencyResult`
   - conflict handling for in-flight requests
3. Add `packages/cache/src/queue.ts` or a minimal worker abstraction:
   - enqueue job
   - claim job
   - retry with backoff
   - dead-letter marker
4. Use cache primitives in core services:
   - import processing
   - export generation
   - stock movement duplicate prevention
5. Add worker process plan:
   - `apps/api/src/workers/imports.worker.ts`
   - `apps/api/src/workers/exports.worker.ts`
   - or a separate `apps/worker` if runtime isolation is needed
6. Tests:
   - lock contention
   - lock expiry
   - idempotent replay returns original result
   - duplicate in-flight request gets typed conflict
   - import/export job cannot process twice

Acceptance criteria:

- Valkey outage behavior is explicit per workflow.
- Long-running import/export work is not tied only to HTTP request lifetime.
- Duplicate stock/import/export operations do not produce duplicate business effects.

## Blocker 3: Admin, User, And RBAC Mutation APIs

Current evidence:

- GET-only admin routes exist in `apps/web/app/api/admin/**`.
- List helpers exist in `packages/auth/src/sessions.ts`.
- DB repositories exist in `packages/db/src/repositories/users.repository.ts` and `rbac.repository.ts`.
- No API exists for create/update users, role assignment mutation, role permission editing, or password reset.

Implementation tasks:

1. Add service functions in `packages/auth/src/sessions.ts` or a new `packages/auth/src/admin.ts`:
   - create user
   - update user profile/status
   - set/reset password
   - assign role
   - remove role assignment
   - update assignment scope
2. Add route handlers in Fastify `admin.routes.ts`:
   - `POST /api/admin/users`
   - `PATCH /api/admin/users/{id}`
   - `POST /api/admin/users/{id}/password`
   - `POST /api/admin/assignments`
   - `DELETE /api/admin/assignments/{id}`
   - optional `POST/PATCH /api/admin/roles`
3. Validation:
   - email format
   - display name
   - status enum
   - password policy
   - role ID exists in tenant
   - scope type and scope ID consistency
4. Permission rules:
   - user lifecycle: `users.manage`
   - role and assignment lifecycle: `roles.manage`
5. Audit logs:
   - `admin.user_created`
   - `admin.user_updated`
   - `admin.password_reset`
   - `admin.role_assigned`
   - `admin.role_removed`
6. Tests:
   - permission allow/deny
   - cross-tenant assignment denied
   - disabled user cannot authenticate
   - no default admin credentials introduced

Acceptance criteria:

- A frontend can fully manage users and roles through APIs without DB access.
- All mutations are audited.
- Password reset does not leak password hashes or raw secret material.

## Blocker 4: Location Management API

Current evidence:

- Schema exists in `packages/db/src/schema/locations.ts`.
- Repository exists in `packages/db/src/repositories/locations.repository.ts`.
- No `packages/core/src/locations` service exists.
- No `apps/web/app/api/locations/**` routes exist.

Implementation tasks:

1. Add `packages/core/src/locations/location-service.ts`.
2. Expose service from `packages/core/src/index.ts`.
3. Add repository functions if missing:
   - list buildings by site
   - list floors by building
   - list rooms by floor
   - update/archive location records
4. Add Fastify routes:
   - `GET /api/locations/sites`
   - `POST /api/locations/sites`
   - `GET /api/locations/sites/{siteId}/buildings`
   - `POST /api/locations/buildings`
   - `GET /api/locations/buildings/{buildingId}/floors`
   - `POST /api/locations/floors`
   - `GET /api/locations/floors/{floorId}/rooms`
   - `POST /api/locations/rooms`
   - optional racks/shelves/bins routes if schema supports frontend needs
5. Permission rules:
   - read: `assets.read` or a new `locations.read`
   - write: `catalog.manage` or a new `locations.manage`
6. Tests:
   - hierarchy creation
   - tenant isolation
   - invalid parent denied
   - archive blocked when assets/stock reference location if required

Acceptance criteria:

- Frontend can manage physical location hierarchy without direct DB access.
- Assets and stock can reference valid tenant-owned locations.

## Blocker 5: Production And On-Prem Deployment Packaging

Current evidence:

- Dev Compose exists in `infra/docker-compose.dev.yml`.
- Observability configs exist under `infra/prometheus`, `infra/grafana`, and `infra/otel`.
- MinIO init exists at `infra/minio/init-bucket.sh`.
- No `infra/Dockerfile.api`, `infra/docker-compose.prod.yml`, release bundle manifest, or offline pnpm-store packaging script was found.

Implementation tasks:

1. Add `infra/Dockerfile.api`:
   - production Node image
   - copied workspace packages and built `apps/api`
   - non-root runtime user
2. Add `infra/docker-compose.prod.yml`:
   - API service
   - PostgreSQL
   - Valkey
   - MinIO
   - OTel collector
   - Prometheus
   - Grafana
   - persistent volumes
   - health checks
3. Add `.env.production.example` or `deploy/env.example`:
   - placeholders only
   - no default application credentials
4. Add air-gap bundle script:
   - collect container image names/tags
   - export images
   - export pnpm store or build artifacts if needed
   - checksum manifest
5. Add backup/restore validation script or QA checklist:
   - database backup
   - MinIO bucket backup
   - restore rehearsal into clean stack
6. Tests/verification:
   - `docker compose -f infra/docker-compose.prod.yml config`
   - production image builds
   - API health readiness works in Compose
   - Prometheus scrapes API metrics

Acceptance criteria:

- Backend can be packaged for self-hosted deployment.
- Air-gap steps are documented and reproducible.
- Secrets are externally supplied and not committed.
