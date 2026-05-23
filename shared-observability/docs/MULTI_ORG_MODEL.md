# Multi Org Model

This shared observability project is reusable across organizations and software systems.

## Required paths
- `/opt/shared-observability/releases/<version>` for immutable releases.
- `/opt/shared-observability/current` for the active release symlink.
- `/opt/shared-observability/orgs/<org-slug>` for org config copied from this project.
- `/etc/shared-observability` for secrets and runtime env.
- `/srv/shared-observability` for Prometheus, Grafana, Loki, and OTel data.
- `/var/backups/shared-observability` for backups.

## Operating rules
- Grafana may be exposed to admins over HTTPS.
- Prometheus, Loki, and OTel Collector stay private.
- Every target must include `org`, `software`, `environment`, `role`, and `instance` labels.
- Add a new org with `scripts/add-org.sh <org-slug>`.
- Add a new software target with `scripts/add-software-target.sh <org-slug> <software>`.
- Validate with `scripts/validate-config.sh` before restart or handoff.
