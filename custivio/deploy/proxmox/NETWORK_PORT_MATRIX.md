# Network Port Matrix

| Source                  | Destination                  | Protocol |           Port | Purpose                            | Public     | Firewall rule                | Comments                       |
| ----------------------- | ---------------------------- | -------: | -------------: | ---------------------------------- | ---------- | ---------------------------- | ------------------------------ |
| User browser            | custivio-app proxy           |      TCP |            443 | Frontend and API HTTPS             | Yes        | Allow from user/admin CIDRs  | Terminate TLS at Caddy/Nginx   |
| User browser            | custivio-app proxy           |      TCP |             80 | HTTP redirect                      | Yes        | Allow optional redirect only | Redirect to 443                |
| custivio-app proxy      | custivio-api                 |      TCP |           3000 | Internal API proxy                 | No         | Localhost/private only       | Prefer 127.0.0.1               |
| custivio-app API        | custivio-data PostgreSQL     |      TCP |           5432 | Database                           | No         | App LXC IP only              | No public access               |
| custivio-app API        | custivio-data MinIO          |      TCP |           9000 | Object storage API                 | No         | App LXC IP only              | Console disabled or admin only |
| custivio-app API/worker | custivio-data Valkey         |      TCP |           6379 | Cache/queue/idempotency            | No         | App LXC IP only              | Auth required                  |
| shared-observability    | custivio-app API             |      TCP |           3000 | Metrics scrape `/api/metrics`      | No         | Observability IP only        | Prefer private IP              |
| custivio-app API        | shared-observability OTel    |      TCP |      4317/4318 | Traces/metrics/logs                | No         | App LXC IP only              | Private OTLP only              |
| Admin browser           | shared-observability Grafana |      TCP |            443 | Grafana HTTPS                      | Controlled | Admin CIDR only              | Use strong admin password      |
| shared-observability    | custivio-data exporters      |      TCP | exporter ports | Node/Postgres/Valkey/MinIO metrics | No         | Observability IP only        | Optional exporters             |
| Admin host              | all nodes                    |      TCP |             22 | SSH administration                 | No public  | Admin CIDR only              | 2FA on Proxmox recommended     |
