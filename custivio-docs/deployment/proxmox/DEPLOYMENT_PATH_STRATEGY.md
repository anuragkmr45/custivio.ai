# Deployment Path Strategy

This deployment uses fixed paths so any operator can deploy, update, roll back, and troubleshoot without guessing.


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

## Rules
1. Never store secrets inside `/opt/*/releases`.
2. Never store application data inside release folders.
3. Release folders are immutable after deployment.
4. Runtime config lives under `/etc`.
5. Data lives under `/srv`.
6. Backups live under `/var/backups`.
7. The active release is selected through the `current` symlink.
8. Rollback switches only the symlink and restarts services unless a DB migration rollback requires DBA approval.
9. Deployment scripts must print the active release path before and after deployment.
10. Verification scripts must show the active release version.
