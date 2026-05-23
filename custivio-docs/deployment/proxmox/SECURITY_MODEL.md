# Security Model

- App LXC is unprivileged, non-root for application runtime, and has no Docker-in-LXC requirement.
- Data VM ports are private only: PostgreSQL 5432, MinIO 9000, Valkey 6379.
- Prometheus, Loki, and OTel are private only. Grafana is exposed only to admins over HTTPS.
- Secrets are stored in `/etc/custivio`, `/etc/custivio-data`, and `/etc/shared-observability` with restrictive permissions.
- Release bundles never contain `.env`, database dumps, object files, cookies, private keys, or production secrets.
- DB migration rollback requires DBA approval because data rollback can be destructive.
