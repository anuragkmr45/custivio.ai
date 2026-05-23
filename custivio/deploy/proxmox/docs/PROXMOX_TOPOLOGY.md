# Proxmox Topology

## LXC 1: custivio-app

- Unprivileged LXC.
- No nesting required.
- No Docker-in-LXC required.
- No host filesystem mounts unless explicitly approved.
- Exposes only 80/443 to users.
- Reverse proxy serves frontend and proxies `/api/*` to Fastify.
- Connects to PostgreSQL, MinIO, and Valkey on the Data VM private IP.
- Sends metrics/logs/traces to shared observability private IP.

## VM 2: custivio-data

- PostgreSQL private port only.
- MinIO private API only.
- Valkey private port only.
- Optional MinIO console only from admin network.
- Persistent data under `/srv/custivio-data`.
- Backups under `/var/backups/custivio`.

## LXC/VM 3: shared-observability

- Grafana HTTPS only for admins.
- Prometheus, Loki, and OTel Collector internal only.
- Per-org and per-software target labels.
