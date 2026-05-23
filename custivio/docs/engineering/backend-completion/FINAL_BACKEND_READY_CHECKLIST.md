# Final Backend Ready Checklist

## Required State

- [x] Backend/DB/Infra readiness is 95%+.
- [x] Verdict is READY TO SHIP EXCEPT FRONTEND.
- [x] Frontend can start fully.
- [x] Critical blockers: 0.
- [x] High-priority gaps are non-blocking and documented.

## Backend Runtime

- [x] Fastify is the default runtime.
- [x] Legacy Next.js backend/runtime files are removed or quarantined after parity confirmation.
- [x] Root scripts default to backend API.
- [x] `AGENTS.md` describes backend-only Fastify architecture.
- [x] `README.md` describes backend-only operation.

## API Contract

- [x] `/api/openapi.json` has paths.
- [x] `/api/openapi.json` has component schemas.
- [x] Major route groups have request/response/error schemas.
- [x] `API_CONTRACT.md` is current.
- [x] `FRONTEND_HANDOFF.md` is current.

## Workers And Jobs

- [x] Worker runtime exists.
- [x] Queue, lock, retry, max attempts, dead-letter, idempotency, and job status are implemented.
- [x] Worker tests pass.
- [x] Production worker deployment is documented.

## Storage

- [x] Final download model is documented.
- [x] Checksum capture is implemented.
- [x] Upload/download/delete flows are authorized, tenant-scoped, and tested.
- [x] Object-store/DB partial failure handling is documented and tested.

## Reliability And Security

- [x] Multi-step mutations have transaction or compensation boundaries.
- [x] Idempotent operations handle same-request replay and different-request conflict.
- [x] Sensitive routes have rate limits or documented scope.
- [x] Raw DB/storage errors are not exposed.

## Observability

- [x] Prometheus scrapes Fastify API.
- [x] Domain metrics exist for auth, assets, stock, jobs, files, and dependencies.
- [x] Alerts/runbook docs are updated.

## Deployment

- [x] `infra/Dockerfile.api` has no web references.
- [x] Production Compose config validates with `infra/env.production.validation.example`.
- [x] Release, offline bundle, backup, restore, rollback, and smoke scripts/docs are current.

## Frontend Real Data

- [x] UAT seed exists and is idempotent.
- [x] UAT seed includes users, roles, tenant, locations, assets, stock, custody, maintenance, audits, imports, and exports.
- [x] Frontend API examples and smoke collection exist.

## Final Tests

- [x] `pnpm install`
- [x] `pnpm check:forbidden`
- [x] `pnpm check`
- [x] `pnpm build:api`
- [x] `pnpm test:api`
- [x] `RUN_DB_TESTS=1 pnpm test`
- [x] `pnpm db:generate`
- [x] `pnpm db:migrate`
- [x] `pnpm db:seed`
- [x] `pnpm db:seed`
- [x] `pnpm db:seed:uat`
- [x] `pnpm db:seed:uat`
- [x] `docker build -f infra/Dockerfile.api .`
- [x] `docker compose --env-file infra/env.production.validation.example -f infra/docker-compose.prod.yml config`
