# Target Devops

## Docker Compose Services

- `postgres`
- `valkey`
- `minio`
- `minio-init`
- `mailpit`
- `otel-collector`
- `prometheus`
- `grafana`

## Local Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm docker:dev`

## Health And Observability

- `/api/health/live`: process liveness, no dependency checks.
- `/api/health/ready`: checks PostgreSQL, Valkey, and MinIO.
- `/api/metrics`: Prometheus metrics.
- Structured logs include request ID, tenant ID, user ID when available, route/action, duration, and error code.
- OpenTelemetry traces wrap route handlers, DB calls, cache calls, and storage calls.

## Air-Gap Readiness

- Document all images and package versions.
- Provide image preload/export instructions.
- Keep all core services local.
- Avoid cloud callbacks in core workflows.
- Keep `.env.example` complete and secrets out of source.

