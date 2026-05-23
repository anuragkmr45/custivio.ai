# Phase 1 QA Checklist

## Automated Checks

- `pnpm install`
- `pnpm check:forbidden`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:seed` again to verify idempotency

## Manual Checks

- Start dev dependencies with `pnpm docker:dev`.
- Confirm PostgreSQL accepts connections.
- Confirm Valkey responds to `PING`.
- Confirm MinIO bucket `custivio` exists.
- Confirm Grafana is available at `http://localhost:3031`.
- Start the app with `pnpm dev`.
- Open `http://localhost:3000`.
- Check `http://localhost:3000/api/health/live`.
- Check `http://localhost:3000/api/health/ready`.
- Check `http://localhost:3000/api/metrics`.

## Product Checks

- No application default admin credentials exist.
- No source code was copied from audited repositories.
- No forbidden package is present in workspace manifests.
- Health readiness clearly reports PostgreSQL, Valkey, and MinIO status.
