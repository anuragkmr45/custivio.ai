# Shared Observability Hardening

- Grafana is admin-only over HTTPS.
- Prometheus, Loki, and OTel Collector are internal only.
- Use per-org labels and Loki tenant strategy.
- Set retention limits.
- Do not allow unlimited log ingestion.
- Store secrets under `/etc/shared-observability` and data under `/srv/shared-observability`.
