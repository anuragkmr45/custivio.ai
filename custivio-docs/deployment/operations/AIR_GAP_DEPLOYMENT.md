# Air-Gap Deployment Notes

## Package Inputs

An air-gapped release must include:

- Application source or approved build artifact.
- `pnpm-lock.yaml` and an offline pnpm store archive.
- Container images for PostgreSQL, Valkey, MinIO, Mailpit if needed, OTel Collector, Prometheus,
  and Grafana.
- Drizzle migrations under `packages/db/src/migrations`.
- Grafana dashboards and provisioning files under `infra/grafana`.
- Release notes and the UAT signoff record.

## Image Handling

1. Pull images in a connected staging environment.
2. Save images with `docker save`.
3. Transfer archives through the approved media scanning process.
4. Load with `docker load` in the air-gapped environment.
5. Verify image digests against the release manifest.

## Application Dependencies

1. Build an offline pnpm store from the exact `pnpm-lock.yaml`.
2. Transfer the store archive with the release.
3. Install with `pnpm install --offline --frozen-lockfile`.
4. Run `pnpm check`, `pnpm build`, `pnpm db:migrate`, and `pnpm db:seed`.

## Runtime Requirements

- PostgreSQL is the only production database.
- Valkey is required for cache, rate limits, idempotency, locks, and queues.
- MinIO or approved S3-compatible object storage is required for attachments and exports.
- No Supabase, Firebase, MongoDB, Neon/serverless-only runtime, or paid SaaS core dependency is
  allowed.
