# Cloud Showcase Environment Variables

Backend:

- `APP_NAME=custivio`
- `APP_BASE_URL=https://api.showcase.example.com`
- `CORS_ALLOWED_ORIGINS=https://app.showcase.example.com`
- `DATABASE_URL=postgresql://...`
- `VALKEY_HOST=...`
- `MINIO_ENDPOINT=https://...`
- `MINIO_BUCKET=custivio`
- `SESSION_SECRET=<strong shared secret>`
- `COOKIE_SECURE=true`
- `OTEL_SERVICE_NAME=custivio-api`
- `METRICS_PREFIX=custivio_`

Frontend:

- `VITE_API_BASE_URL=https://api.showcase.example.com`

Cookie/CORS notes:

- Use HTTPS for frontend and backend.
- Add every frontend preview/production origin to `CORS_ALLOWED_ORIGINS`.
- Prefer same parent domain subdomains for fewer cookie issues.
