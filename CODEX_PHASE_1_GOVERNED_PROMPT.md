# Codex Prompt — Phase 1 With Governance Guardrails

Paste this prompt into Codex after the audit is complete.

---

You are implementing the first real coding phase of `enterprise-inventory-platform`.

Before creating feature code, create the governance foundation so the project stays organized and future agents do not hallucinate or scatter files.

## Context

The audit report exists in:

```text
inventory-research/repo-audit/
```

Use it as reference only. Do not copy source code from audited repos.

Important audit decisions:

- Best stack references: FinOpenPOS, dashboard-boilerplate, ce, QUANTUM-STASH.
- Domain references only: SAMS, Sanchay, Roomer, PartPilot, Panthora, ChittyAssets.
- Strict rejects: Prisma, Supabase runtime, Neon/serverless runtime, Firebase, MongoDB, cloud-only storage, localStorage/demo auth, default admin credentials, paid SaaS core dependencies, unapproved AGPL/Elastic/O'Saasy code copying.

## Hard requirements

Use:

- Next.js App Router
- React
- TypeScript
- PostgreSQL
- Drizzle ORM
- Valkey
- MinIO
- Docker Compose
- OpenTelemetry/Prometheus/Grafana
- Zod/env validation
- ESLint flat config with strict boundaries

Do not add:

- Prisma
- `@prisma/client`
- Supabase runtime dependency
- Firebase
- MongoDB
- Neon/serverless-only runtime
- paid SaaS core dependency
- local filesystem production storage

## Required first output

Create a new repo/folder:

```text
enterprise-inventory-platform/
```

## Required structure

```text
enterprise-inventory-platform/
  AGENTS.md
  eslint.config.mjs
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  scripts/
    check-forbidden-deps.mjs
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
    docker-compose.dev.yml
    prometheus/
    grafana/
    otel/
    minio/
  docs/
    ADR/
    QA/
    engineering/
      FOLDER_AND_BOUNDARY_RULES.md
      DB_DRIZZLE_RULES.md
      BACKEND_API_RULES.md
      ESLINT_AND_CODE_QUALITY.md
      FEATURE_IMPLEMENTATION_WORKFLOW.md
      REVISED_PHASE_PLAN.md
  tests/
    integration/
    e2e/
```

## Governance tasks

1. Create root `AGENTS.md` with:
   - product identity
   - target stack
   - forbidden dependencies
   - folder ownership rules
   - database rules
   - API/backend rules
   - testing rules
   - feature implementation workflow
   - done definition

2. Create `eslint.config.mjs` with strict TypeScript rules and boundary rules:
   - block Prisma/Supabase/Firebase/MongoDB/Neon runtime
   - block direct DB imports from UI/client code
   - block direct MinIO/Valkey imports from UI/client code
   - block `process.env` outside config package
   - block client components from Node-only imports
   - import ordering and cycle detection
   - no floating promises
   - no explicit any except tests/scripts
   - no console except scripts and controlled warnings/errors

3. Create `scripts/check-forbidden-deps.mjs`.

4. Create engineering docs:
   - folder/boundary rules
   - Drizzle/PostgreSQL rules
   - backend API rules
   - ESLint/code-quality policy
   - feature implementation workflow
   - revised phase plan

## Application scaffold tasks

After governance files are created, create the fresh app scaffold:

1. Workspace config.
2. Next.js app in `apps/web`.
3. Shared packages:
   - `packages/db`
   - `packages/core`
   - `packages/auth`
   - `packages/storage`
   - `packages/cache`
   - `packages/config`
   - `packages/telemetry`
4. Docker Compose dev services:
   - postgres
   - valkey
   - minio
   - minio-init
   - mailpit
   - otel-collector
   - prometheus
   - grafana
5. Health endpoints:
   - `/api/health/live`
   - `/api/health/ready`
   - `/api/metrics`
6. Basic Drizzle setup:
   - `tenants`
   - `users`
   - `audit_logs`
7. Basic wrappers:
   - DB client
   - Valkey client
   - MinIO client
   - env config
   - logger/request ID

## Root scripts required

```json
{
  "dev": "...",
  "build": "...",
  "typecheck": "...",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "...",
  "format:check": "...",
  "test": "...",
  "db:generate": "...",
  "db:migrate": "...",
  "db:seed": "...",
  "docker:dev": "...",
  "check:forbidden": "node scripts/check-forbidden-deps.mjs",
  "check": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm check:forbidden"
}
```

## Acceptance criteria

- `pnpm install` works.
- `pnpm check` runs.
- `pnpm lint` enforces architecture rules.
- Forbidden dependency checker works.
- Docker Compose starts dependencies.
- PostgreSQL readiness is checked.
- Valkey readiness is checked.
- MinIO readiness is checked.
- App starts.
- Health endpoints exist.
- Drizzle migration exists for initial tables.
- Seed is idempotent.
- No forbidden dependency is present.
- No code copied directly from audited repos.
- All new files follow folder rules.

## Final response required from Codex

When done, report:

1. Files created.
2. Commands run.
3. Commands that passed/failed.
4. Any unresolved issues.
5. Manual QA checklist.
6. Next prompt for Phase 2.
