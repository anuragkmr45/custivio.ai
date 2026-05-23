# Custivio Proxmox Production Security Checklist

- TLS enabled at the reverse proxy.
- Only HTTPS/API entrypoint exposed to users.
- PostgreSQL, Valkey, MinIO admin, Prometheus, Grafana, and SSH restricted to admin networks.
- Strong `SESSION_SECRET` shared by all API instances.
- `COOKIE_SECURE=true` in HTTPS environments.
- `CORS_ALLOWED_ORIGINS` contains only approved frontend origins.
- `/api/metrics` and `/api/ops/status` protected by network allowlist or admin-only proxy rules where possible.
- Backups encrypted and restore rehearsals completed.
- MinIO bucket is private; attachments are downloaded through authorized API routes.
- Rate limits enabled for auth, sensitive mutations, uploads/downloads, import/export, ops, metrics, and docs.
- Logs include request IDs and do not expose raw DB errors.
- Worker scaling reviewed before running multiple workers per queue.
