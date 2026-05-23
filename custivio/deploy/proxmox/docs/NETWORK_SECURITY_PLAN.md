# Network Security Plan

Use private CIDR placeholders such as `<APP_PRIVATE_IP>`, `<DATA_PRIVATE_IP>`, `<OBS_PRIVATE_IP>`, `<ADMIN_CIDR>`, and `<USER_CIDR>`. Do not hardcode real customer networks in release artifacts.

- App proxy is the only user-facing Custivio service.
- PostgreSQL, MinIO, Valkey, Prometheus, Loki, and OTel Collector must never be public.
- Grafana is admin-facing only and must use HTTPS and strong credentials.
- Proxmox firewall and guest firewalls should both enforce the matrix in `FIREWALL_RULES.md`.
