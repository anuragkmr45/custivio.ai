# Cloud Showcase Environment Variables

Backend:

- `APP_NAME=custivio`
- `APP_BASE_URL=https://api.showcase.example.com`
- `CORS_ALLOWED_ORIGINS=https://app.showcase.example.com`
- `DATABASE_URL=postgresql://...`
- `DATABASE_POOL_MAX=4`
- `DATABASE_SSL=true`
- `VALKEY_HOST=...`
- `VALKEY_PORT=6379`
- `VALKEY_PASSWORD=<managed-service token>`
- `VALKEY_USE_TLS=true`
- `MINIO_ENDPOINT=https://...`
- `MINIO_REGION=...`
- `MINIO_ACCESS_KEY=<server-side S3 access key>`
- `MINIO_SECRET_KEY=<server-side S3 secret key>`
- `MINIO_BUCKET=custivio`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`
- `RUN_WORKER_IN_API=true`
- `WORKER_INTERVAL_MS=30000`
- `OTEL_SERVICE_NAME=custivio-api`
- `METRICS_PREFIX=custivio_`

Frontend:

- `VITE_API_BASE_URL=https://api.showcase.example.com`

Cookie/CORS notes:

- Use HTTPS for frontend and backend.
- Add every frontend preview/production origin to `CORS_ALLOWED_ORIGINS`.
- Prefer same parent domain subdomains for fewer cookie issues.
- When the frontend and API use different sites (for example, `workers.dev` and `onrender.com`), set `COOKIE_SAME_SITE=none` together with `COOKIE_SECURE=true`.
- Never expose the PostgreSQL URL, Upstash token, or S3 credentials to the frontend.
