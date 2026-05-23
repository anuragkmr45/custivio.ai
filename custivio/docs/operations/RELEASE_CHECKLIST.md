# Release Checklist

## Required Gates

- [ ] `pnpm check`
- [ ] `pnpm build:api`
- [ ] `pnpm test:api`
- [ ] `RUN_DB_TESTS=1 pnpm test`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed` twice for idempotency
- [ ] `pnpm docker:dev`
- [ ] `scripts/validate-prod-compose.sh`
- [ ] `docker build -f infra/Dockerfile.api .`
- [ ] `/api/health/live` returns 200
- [ ] `/api/health/ready` returns 200
- [ ] `/api/metrics` returns Prometheus text
- [ ] `/api/ops/status` returns dependency status
- [ ] `/api/openapi.json` returns OpenAPI JSON
- [ ] `/api/docs` returns Swagger UI
- [ ] `scripts/smoke-api.sh` passes

## Release Evidence

- [ ] Migration list reviewed.
- [ ] Backup completed before deployment.
- [ ] Restore procedure tested in an isolated environment.
- [ ] Forbidden dependency check passed.
- [ ] UAT signoff is complete.
- [ ] Known gaps are documented in `docs/engineering/PROJECT_PROGRESS.md`.
- [ ] Previous image tag and backup paths are recorded for rollback.

## Go/No-Go

Do not release if any required gate fails, health checks are red, or backup/restore evidence is
missing.
