# Observability And Alerts

## Signals

- `/api/metrics` exposes Prometheus text metrics.
- `/api/health/live` verifies process liveness.
- `/api/health/ready` verifies PostgreSQL, Valkey, and MinIO readiness.
- `/api/ops/status` returns operational status with request ID and dependency details.
- Fastify request logs include `requestId`, route, duration, and status code.

## Prometheus Targets

- Dev Compose uses `infra/prometheus/prometheus.yml` and scrapes the host Fastify API at `host.docker.internal:3001`.
- Production Compose uses `infra/prometheus/prometheus.prod.yml` and scrapes the API service at `api:3000`.
- OTel collector metrics are scraped from `otel-collector:8889`.

## Metric Names

Metric names are prefixed by `METRICS_PREFIX`; examples below use the default `custivio_` prefix.

| Metric                                            | Labels                      | Purpose                                           |
| ------------------------------------------------- | --------------------------- | ------------------------------------------------- |
| `custivio_api_requests_total`           | `method`, `route`, `status` | API request volume by route and status.           |
| `custivio_api_request_duration_seconds` | `method`, `route`, `status` | API latency histogram.                            |
| `custivio_auth_login_attempts_total`    | `result`                    | Login attempts, successes, and failures.          |
| `custivio_asset_mutations_total`        | `action`                    | Asset create/update/delete counters.              |
| `custivio_stock_movements_total`        | `movement_type`             | Stock receive/issue/transfer/adjust volume.       |
| `custivio_import_jobs_total`            | `status`                    | Import job lifecycle counts.                      |
| `custivio_export_jobs_total`            | `status`                    | Export job lifecycle counts.                      |
| `custivio_file_operations_total`        | `operation`, `result`       | Upload/download/delete/export download flow.      |
| `custivio_worker_jobs_total`            | `queue`, `type`, `status`   | Worker job outcomes.                              |
| `custivio_worker_job_duration_seconds`  | `queue`, `type`, `status`   | Worker job duration histogram.                    |
| `custivio_dependency_failures_total`    | `dependency`                | PostgreSQL, Valkey, and MinIO readiness failures. |

## Grafana

Dashboards are provisioned from `infra/grafana/dashboards`.

- `phase-1-overview.json`: baseline process and dependency dashboard.
- `production-hardening.json`: readiness, HTTP, and runtime panels for release operations.

## Recommended Alerts

- Readiness endpoint returns non-200 for 2 consecutive minutes.
- `increase(custivio_dependency_failures_total[2m]) > 0` for PostgreSQL, Valkey, or MinIO.
- HTTP 5xx rate exceeds release threshold for 5 minutes from `custivio_api_requests_total`.
- p95 API latency from `custivio_api_request_duration_seconds` exceeds the agreed service target.
- Login failure rate from `custivio_auth_login_attempts_total{result="failure"}` spikes above normal baseline.
- Worker dead-letter count from `custivio_worker_jobs_total{status="dead_letter"}` increases.
- Process memory grows continuously over the agreed baseline.

## Incident Triage

1. Capture request ID from user-facing errors.
2. Check `/api/ops/status`.
3. Check Prometheus target health.
4. Check Grafana panels for dependency latency changes.
5. Preserve logs and audit records before restarting services.
