# Proxmox Architecture

Custivio is deployed as three isolated runtime areas.

## custivio-app LXC

Runs the static frontend artifact, Fastify API, worker, and reverse proxy. It is unprivileged, runs API and worker as the `inventory` user, and does not run PostgreSQL, MinIO, Valkey, Prometheus, Loki, Grafana, or OTel Collector.

## custivio-data VM

Runs PostgreSQL, MinIO, and Valkey on private interfaces. It owns persistent data and backups. It has no public service exposure.

## shared-observability LXC or VM

Runs Grafana, Prometheus, Loki, and OTel Collector. It is reusable for other organizations and software systems through file-based service discovery and per-org folders.
