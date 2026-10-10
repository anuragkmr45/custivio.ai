# Render Demo Deployment

This branch includes `/render.yaml` for a cloud-only demonstration deployment. It builds the existing Fastify Docker image and uses external PostgreSQL, Valkey-compatible Redis, and S3-compatible object storage.

## Free-demo topology

- API: Render Free web service.
- Background processing: import and export consumers run inside the API process when `RUN_WORKER_IN_API=true`.
- PostgreSQL: Supabase PostgreSQL through the session pooler and the existing `pg`/Drizzle stack.
- Queue/cache: Upstash through its native Redis TLS endpoint and the existing Valkey GLIDE client.
- Attachments: Supabase Storage through its S3-compatible endpoint and the existing AWS S3 client.

No Supabase, Upstash, or Cloudinary SDK is added. Cloudinary is not used because Custivio attachments include arbitrary evidence and export files, and the storage boundary requires an S3-compatible API.

## Deployment

1. Create a Render Blueprint from the `cloud/free-tier-deployment` branch and the root `render.yaml` file.
2. Copy `infra/env.cloud.example` values into the prompted Blueprint environment variables.
3. Use a Supabase session-pooler connection string on port `5432` for `DATABASE_URL`.
4. Create a private `custivio` Supabase Storage bucket and generate server-side S3 credentials.
5. Copy the Upstash endpoint, port, and token into the `VALKEY_*` settings.
6. Set `APP_BASE_URL` to the Render API URL and `CORS_ALLOWED_ORIGINS` to the exact deployed frontend origin.
7. The container start command applies idempotent Drizzle migrations. Render's first-deploy hook then runs the idempotent administrator bootstrap using the `BOOTSTRAP_*` secrets.

For an optional realistic demonstration dataset, follow [SHOWCASE_DATA.md](./SHOWCASE_DATA.md). The showcase seed is deliberately separate from service startup and must be run only against the intended demo database.

## Embedded worker behavior

Render does not provide a separate free background-worker instance. The embedded loop reuses the same import/export processors, Valkey queues, locks, retries, and dead-letter behavior as the standalone worker.

This is demo-grade only:

- Render can sleep the web service after 15 minutes without inbound traffic.
- A restart or sleep can interrupt an in-flight job.
- Queued jobs resume after the next request wakes the API.
- Imports and exports should remain small enough to complete within an active service window.
- The cloud profile polls every 30 seconds so idle queue checks stay within Upstash's free command allowance; the on-prem worker default remains five seconds.

Do not use artificial keep-alive traffic to circumvent Render free-tier sleep behavior.

## Production boundary

The local filesystem remains ephemeral and is never used for attachments. This deployment is for seeded demonstration data only and has no production SLA or backup guarantee. Production/on-prem deployment remains the unchanged Proxmox or Docker Compose path on `main`.
