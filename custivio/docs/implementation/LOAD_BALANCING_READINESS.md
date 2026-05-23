# Custivio Load Balancing Readiness

Report date: 2026-05-22

## Status

Custivio API is ready to run behind a reverse proxy or load balancer when all API instances share PostgreSQL, Valkey, MinIO/S3-compatible storage, and identical session configuration.

## Operator Requirements

- Run two or more API instances only when all instances use the same `DATABASE_URL`, Valkey endpoint, MinIO/S3 endpoint, and `SESSION_SECRET`.
- Send load balancer health checks to `/api/health/ready`.
- Do not send traffic to an API instance until readiness returns HTTP 200.
- Sticky sessions are not required because session state is shared through the database and cookies.
- Keep Valkey shared across instances for rate limits, idempotency, locks, and worker coordination.
- Uploaded files must use MinIO/S3-compatible storage. Do not rely on local API instance filesystem storage.
- Configure `CORS_ALLOWED_ORIGINS` per environment and keep credentialed CORS enabled only for trusted frontend origins.
- Use HTTPS and secure cookies for cross-site frontend/backend deployments.
- Expose only the reverse proxy publicly. Keep PostgreSQL, Valkey, MinIO admin, Prometheus, and Grafana private.

## Worker Scaling

- Start with one worker per queue in constrained on-prem deployments.
- Multiple workers are allowed only when queue lock/idempotency behavior has been validated in staging.
- Keep API and worker deployments independently restartable.

## Reverse Proxy Defaults

- Request timeout: at least 60 seconds for imports/exports and uploads.
- Upload body size: align with backend storage policy and proxy body size.
- Preserve `X-Forwarded-For` and `X-Forwarded-Proto`.
- Forward `Cookie` and `Set-Cookie` headers unchanged.
- Terminate TLS at the proxy or before it; never expose plain HTTP publicly.
