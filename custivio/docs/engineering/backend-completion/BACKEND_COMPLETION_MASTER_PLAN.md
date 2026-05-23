# Backend Completion Master Plan

Report date: 2026-05-16

## Goal

Bring backend, database, infrastructure, deployment, observability, API contract, and testing readiness from the latest audited 88% state to 95%+ so the frontend team can build against real Fastify APIs and seeded data.

Frontend UI implementation is out of scope. The final runtime target is backend-only Fastify plus shared packages.

## Current Readiness Baseline

- Latest audit: `docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT.md`
- Readiness: 88%
- Verdict: MOSTLY READY, BUT BLOCKERS REMAIN
- Critical blockers: 1
- High-priority gaps: 7

## Already Ready

- Fastify API app exists in `apps/api`.
- Drizzle/PostgreSQL schema, migrations, and repositories exist.
- Auth, sessions, RBAC, tenant isolation, and admin mutations exist.
- MinIO upload, authorized download, and delete paths exist.
- Valkey client, lock, idempotency, rate-limit, and queue primitives exist.
- Dev Docker Compose stack exists.
- API, DB, and integration tests exist.
- Health, readiness, metrics, ops, OpenAPI, and docs endpoints exist.

## Pending Work

1. Finish backend-only ownership cleanup.
2. Add complete OpenAPI schemas for frontend typed clients.
3. Implement real worker runtime with retry/dead-letter behavior.
4. Harden storage checksum/download contract and object-store compensation.
5. Strengthen transactions, idempotency, conflict mapping, and rate limiting.
6. Align observability and Prometheus with Fastify backend.
7. Fix production/on-prem release packaging and compose validation.
8. Add UAT seed data and frontend real-data examples.
9. Perform final cleanup and produce a post-completion readiness audit.

## Constraints

- Preserve existing API paths unless documented in `docs/engineering/API_CONTRACT.md` and `docs/engineering/FRONTEND_HANDOFF.md`.
- Do not add Prisma, Supabase runtime, Firebase, MongoDB/Mongoose, Neon serverless runtime, or paid SaaS core dependencies.
- Do not implement React pages or frontend UI.
- Do not delete source code, migrations, tests, infra, or governance docs blindly.
- Legacy Next.js runtime may be quarantined or removed only after Fastify parity is confirmed and documented.

## Required Verification Gates

Baseline and final:

```bash
pnpm install
pnpm check:forbidden
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:seed
pnpm docker:dev
docker compose -f infra/docker-compose.dev.yml ps
```

Production packaging gates:

```bash
docker build -f infra/Dockerfile.api .
docker compose --env-file infra/env.production.validation.example -f infra/docker-compose.prod.yml config
```

## Completion Criteria

- Final audit score is 95%+.
- Verdict is READY TO SHIP EXCEPT FRONTEND.
- Frontend can start fully.
- No critical blockers remain.
- All required tests and packaging checks pass or have a documented sandbox-only equivalent.
