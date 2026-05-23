# Shared Observability

Reusable Prometheus, Grafana, Loki, and OpenTelemetry Collector deployment for multiple organizations and software systems.

## Model
- Base stack lives under `base/`.
- Organization-specific config lives under `orgs/<org-slug>/`.
- Prometheus uses file-based service discovery.
- Grafana datasources and dashboards are provisioned from files.
- Loki and OTel Collector are internal only.

## Install paths
- `/opt/shared-observability/current`
- `/etc/shared-observability`
- `/srv/shared-observability`
- `/var/backups/shared-observability`

## Validate
```bash
bash scripts/validate-config.sh
```
