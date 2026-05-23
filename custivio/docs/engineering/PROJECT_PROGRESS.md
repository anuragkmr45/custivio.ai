# Project Progress

Report date: 2026-05-16

## Current Status

- Current phase: Backend completion complete.
- Overall status: `ready-to-ship-except-frontend`.
- Active runtime: Fastify API in `apps/api`.
- Frontend UI runtime: out of scope for this repo; legacy `apps/web` is quarantined under `_cleanup_review/backend-completion/apps-web-legacy`.
- Target outcome: backend, database, infrastructure, deployment, observability, API contract, and tests ready for a separate frontend team.

## Completed Product Phases

- Phase 1 - Governance and scaffold: complete.
- Phase 1 cleanup: complete.
- Phase 2 - Database foundation: complete.
- Phase 3 - Auth, RBAC, and tenant isolation: complete.
- Phase 4 - Asset catalog: complete.
- Phase 5 - Asset registry: complete.
- Phase 6 - Stock and consumables: complete.
- Phase 7 - Custody, movement, and maintenance: complete.
- Phase 8 - Audit, import/export, and reporting: complete.
- Phase 9 - Production hardening: complete.
- Fastify migration: route parity, API tests, DB-backed tests, Docker dev gates, and production Compose validation have passed.

## Backend Completion Progress

| Phase                           | Status   | Evidence                                                                          |
| ------------------------------- | -------- | --------------------------------------------------------------------------------- |
| Control files                   | Complete | `docs/engineering/backend-completion/*`                                           |
| Phase 0 baseline                | Complete | `docs/engineering/backend-completion/CURRENT_BACKEND_STATE.md`, `TEST_RUN_LOG.md` |
| Phase 1 backend-only cleanup    | Complete | Fastify root scripts, `apps/web` quarantine, API Dockerfile validation            |
| Phase 2 OpenAPI contract        | Complete | `apps/api/src/openapi/schemas.ts`, `apps/api/src/tests/openapi-schema.test.ts`    |
| Phase 3 workers/jobs            | Complete | `apps/api/src/workers/**`, worker tests, worker CLI                               |
| Phase 4 storage hardening       | Complete | checksum migration, storage policies, storage route tests                         |
| Phase 5 reliability             | Complete | idempotency fingerprints, scoped rate limits, DB-backed tests                     |
| Phase 6 observability           | Complete | domain metrics, Prometheus targets, Grafana/OTel docs                             |
| Phase 7 release packaging       | Complete | backend-only Dockerfile, prod Compose validation, rollback/release docs           |
| Phase 8 frontend data readiness | Complete | `pnpm db:seed:uat`, UAT seed tests, frontend examples, `.http` collection         |
| Phase 9 cleanup                 | Complete | docs index, cleanup manifest, final gate rerun                                    |
| Phase 10 final audit            | Complete | `BACKEND_DB_INFRA_FINAL_READINESS_AUDIT_AFTER_COMPLETION.md`                      |

## Current Active Surfaces

- API routes: `apps/api/src/routes/**`
- API plugins: `apps/api/src/plugins/**`
- Worker runtime: `apps/api/src/workers/**`
- Business services: `packages/core/src/**`
- Auth/session services: `packages/auth/src/**`
- DB schema, repositories, migrations, seed: `packages/db/src/**`
- Valkey primitives: `packages/cache/src/**`
- MinIO/S3 storage: `packages/storage/src/**`
- Telemetry/logging/metrics: `packages/telemetry/src/**`
- Dev/prod infra: `infra/**`
- Integration/API tests: `tests/integration/**`, `apps/api/src/tests/**`

## Latest Verified Gates

- `pnpm check`: pass.
- `pnpm build:api`: pass.
- `pnpm test:api`: pass.
- `pnpm db:seed`: pass with local IPC/PostgreSQL access.
- `pnpm db:seed:uat`: pass twice with local IPC/PostgreSQL access.
- `RUN_DB_TESTS=1 pnpm test`: pass, 24 files and 80 tests.
- `docker build -f infra/Dockerfile.api .`: pass.
- `docker compose --env-file infra/env.production.validation.example -f infra/docker-compose.prod.yml config`: pass.
- Endpoint smoke checks: pass on `API_PORT=3002` because local port `3000` was already occupied.

## Remaining Work

- Frontend UI implementation is now unblocked and remains out of scope for this backend-only repo.
- Before release tagging, clean the parent worktree noise and decide whether to retain or delete `_cleanup_review/backend-completion/apps-web-legacy`.
