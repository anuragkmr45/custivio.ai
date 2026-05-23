# Custivio Deployment Options

| Model | Fit | Notes |
| --- | --- | --- |
| Local development | Engineering and QA | Docker Compose starts PostgreSQL, Valkey, MinIO, Mailpit, OpenTelemetry, Prometheus, and Grafana. |
| On-prem single environment | SMEs and IT stores | API, worker, frontend, database, cache, and object storage run on customer-controlled infrastructure. |
| Proxmox deployment | Enterprise and government | App LXC, data VM, and shared observability node are documented under `deployment/proxmox/`. |
| Air-gapped deployment | Restricted networks | Offline release bundle, image export, pnpm store bundle, migration, and validation docs are included. |
| Hybrid/private cloud | Managed infrastructure | Custivio can run on private VMs where PostgreSQL, Valkey, MinIO, and observability are customer-controlled. |

Custivio does not require Supabase, Firebase, MongoDB, Neon, paid SaaS storage, or production filesystem attachment storage.

