# Phase 1 Cleanup Report

## Current Project Structure Summary

- `apps/web`: Next.js App Router application with app shell, health routes, Tailwind/Radix/shadcn-style baseline, and web package config.
- `packages/db`: Drizzle schema, generated migration, migration runner, seed runner, PostgreSQL client, and DB health check.
- `packages/core`: readiness orchestration for PostgreSQL, Valkey, and MinIO.
- `packages/auth`: Phase 1 auth boundary placeholder.
- `packages/cache`: Valkey GLIDE client and health check.
- `packages/storage`: MinIO/S3-compatible client, health check, and object-key helpers.
- `packages/config`: Zod environment validation.
- `packages/telemetry`: request IDs, structured logger, and Prometheus metrics.
- `infra`: Docker Compose plus PostgreSQL, Valkey, MinIO, Mailpit, OTel collector, Prometheus, and Grafana config.
- `docs`: ADR, QA checklist, engineering policies, and this cleanup report.
- `tests`: integration tests for forbidden dependencies and seed idempotency.

## Files Reviewed

- Governance: `AGENTS.md`, `docs/engineering/FOLDER_AND_BOUNDARY_RULES.md`, `docs/engineering/DB_DRIZZLE_RULES.md`, `docs/engineering/BACKEND_API_RULES.md`, `docs/engineering/ESLINT_AND_CODE_QUALITY.md`, `docs/engineering/FEATURE_IMPLEMENTATION_WORKFLOW.md`.
- Workspace/package config: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `tsconfig.eslint.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `vitest.config.ts`.
- App config/source: `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/next-env.d.ts`, `apps/web/tsconfig.json`, `apps/web/postcss.config.mjs`, `apps/web/tailwind.config.ts`, `apps/web/app/**`, `apps/web/components/**`, `apps/web/lib/**`.
- Package source/config: `packages/**/package.json`, `packages/**/tsconfig.json`, `packages/**/src/**`, `packages/db/drizzle.config.ts`.
- Infra: `infra/docker-compose.dev.yml`, `infra/prometheus/prometheus.yml`, `infra/otel/collector-config.yml`, `infra/minio/init-bucket.sh`, `infra/grafana/**`.
- Tests: `tests/integration/**`, `tests/e2e/.gitkeep`.

## Files Kept And Why

- `AGENTS.md` and all engineering docs: required governance and workflow references.
- Drizzle migration files under `packages/db/src/migrations`: required database history and generated migration metadata.
- `packages/db/src/seed.ts`: required idempotent seed runner.
- Docker, Prometheus, Grafana, OTel, and MinIO config under `infra`: required local/on-prem dev dependencies and observability.
- `pnpm-lock.yaml`: required reproducible installs.
- `.gitkeep` placeholders in `tests/e2e` and `docs/engineering/features`: intentional future-phase directories.
- `apps/web/next-env.d.ts`: required Next.js type environment file. It references generated `.next/types`, so `apps/web/package.json` now runs `next typegen` before `tsc --noEmit`.
- `node_modules`: local install artifact kept because it is outside source ownership, ignored by policy, and needed for immediate verification.

## Files Removed And Why

- `apps/web/.next/`: removed as stale local Next.js build/dev output. It is generated, ignored, and recreated by `next typegen`, `next dev`, or `next build`.
- `apps/web/tsconfig.tsbuildinfo`: removed as TypeScript incremental build output. It is generated and now ignored via `.gitignore` and `.prettierignore`.

## Supporting Changes

- Updated `apps/web/package.json` so `typecheck` runs `next typegen && tsc --noEmit`. This prevents source typechecking from depending on stale `.next/types` output.
- Added `*.tsbuildinfo` and `*.tsbuildinfo.*` to `.gitignore` and `.prettierignore`.

## Files Moved To `_cleanup_review/phase-1`

- None. No uncertain source files were found.

## Commands Run Before Cleanup

- `git status --short || true`: reported `fatal: not a git repository`.
- `pnpm check`: passed.
- `pnpm build`: passed outside the sandbox.
- `RUN_DB_TESTS=1 pnpm test`: passed outside the sandbox.

## Cleanup Candidate Detection

- OS metadata/backups/logs scan found only `apps/web/.next/dev/logs/next-development.log`, covered by removing generated `.next`.
- Accidental audit/reference repo scan found no copied `repo-audit` folder and no copied shortlisted repositories.
- Generated-output scan found `apps/web/.next`.
- Empty source-tree file scan found only intentional placeholders after excluding `node_modules`.
- Reference checks confirmed `.next` is intentionally ignored and generated; `apps/web/next-env.d.ts` requires generated Next types, addressed with `next typegen`.

## Commands Run After Cleanup

- `pnpm check`: passed.
- `pnpm build`: passed outside the sandbox.
- `pnpm db:migrate`: passed outside the sandbox.
- `pnpm db:seed`: passed outside the sandbox.
- `RUN_DB_TESTS=1 pnpm test`: passed outside the sandbox.
- `pnpm docker:dev`: passed outside the sandbox; Docker services were running.
- `pnpm dev`: started successfully on `http://localhost:3002` because port `3000` was already occupied.
- `curl -sS -i http://127.0.0.1:3002/api/health/live`: returned `200`.
- `curl -sS -i http://127.0.0.1:3002/api/health/ready`: returned `200` with PostgreSQL, Valkey, and MinIO all healthy.
- `curl -sS -i http://127.0.0.1:3002/api/metrics`: returned `200` with Prometheus text output.
- Temporary `pnpm dev` process was stopped after endpoint verification.
- Generated `.next/` and `tsconfig.tsbuildinfo` artifacts created by verification were removed again after verification.

## Risk Notes

- `apps/web/.next/` will be recreated by verification commands. It remains ignored and should not be treated as source.
- `apps/web/tsconfig.tsbuildinfo` may be recreated by TypeScript. It remains ignored and should not be committed.
- The project folder is not currently a git repository, so cleanup was validated by filesystem inspection and commands rather than `git status` diffs.
- `node_modules` was left intact. It is ignored local install state, not product source, and keeping it avoids unnecessary reinstall before Phase 2.
