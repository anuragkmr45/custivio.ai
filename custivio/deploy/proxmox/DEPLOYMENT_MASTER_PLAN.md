# Proxmox Deployment Master Plan

## Goal

Prepare Custivio for a three-node Proxmox deployment without changing product business logic, API behavior, or database schema.

## Target topology

- LXC 1 `custivio-app`: frontend artifact, Fastify API, backend worker, reverse proxy, systemd services.
- VM 2 `custivio-data`: PostgreSQL, MinIO, Valkey, backup and restore scripts, private network only.
- LXC or VM 3 `shared-observability`: Grafana, Prometheus, Loki, OpenTelemetry Collector, reusable across organizations and software systems.

## Security assumptions

- App LXC is unprivileged and does not require Docker-in-LXC.
- Data services are reachable only on private IPs from the app LXC, backup/admin hosts, or observability where required.
- Only HTTPS app traffic and Grafana admin traffic are exposed through controlled reverse proxies.
- Release folders are immutable after deployment; secrets live under `/etc`; data lives under `/srv`; backups live under `/var/backups`.

## Canonical paths

App LXC:

- /opt/custivio/releases/<version>
- /opt/custivio/current
- /opt/custivio/tools
- /opt/custivio/shared/tmp
- /opt/custivio/shared/uploads-tmp
- /opt/custivio/shared/runtime
- /etc/custivio/custivio.env
- /etc/custivio/reverse-proxy.env
- /etc/custivio/app-lxc.env
- /etc/custivio/allowed-origins.conf
- /var/log/custivio/reverse-proxy
- /var/log/custivio/deployment

Data VM:

- /srv/custivio-data/postgres
- /srv/custivio-data/minio
- /srv/custivio-data/valkey
- /etc/custivio-data/postgres.env
- /etc/custivio-data/minio.env
- /etc/custivio-data/valkey.env
- /etc/custivio-data/backup.env
- /var/backups/custivio/postgres
- /var/backups/custivio/minio
- /var/backups/custivio/valkey
- /var/backups/custivio/release-manifests
- /var/backups/custivio/restore-rehearsals

Shared observability:

- /opt/shared-observability/releases/<version>
- /opt/shared-observability/current
- /opt/shared-observability/orgs/<org-slug>
- /opt/shared-observability/tools
- /etc/shared-observability/observability.env
- /etc/shared-observability/grafana.env
- /etc/shared-observability/loki.env
- /etc/shared-observability/otel.env
- /srv/shared-observability/prometheus
- /srv/shared-observability/grafana
- /srv/shared-observability/loki
- /srv/shared-observability/otel
- /var/backups/shared-observability/grafana
- /var/backups/shared-observability/prometheus
- /var/backups/shared-observability/loki
- /var/backups/shared-observability/configs

## Update and rollback model

Deployments install a new immutable release under `/opt/custivio/releases/<version>` and switch `/opt/custivio/current` only after checks pass. Normal rollback switches the symlink and restarts services. Any database migration rollback requires manual DBA approval.

## Validation approach

Every path has a validation script. The final handoff gate is `bash deploy/proxmox/scripts/validate-all.sh` from `custivio/`, plus `bash ../shared-observability/scripts/validate-config.sh` when the sibling project exists.

## Resume

If work stops, read `RESUME_INSTRUCTIONS.md`, `DEPLOYMENT_TASK_BOARD.md`, `DEPLOYMENT_PROGRESS.md`, `TEST_RUN_LOG.md`, and the shared observability task board before continuing.
