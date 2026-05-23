# Secret Management

Secrets live in `/etc/custivio`, `/etc/custivio-data`, and `/etc/shared-observability`. Release bundles and `/opt/*/releases` must never contain real secrets. Rotate database, MinIO, Valkey, Grafana, and TLS secrets through maintenance windows and restart affected services.
