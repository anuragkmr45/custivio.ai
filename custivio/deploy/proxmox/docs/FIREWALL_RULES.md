# Firewall Rules

| Node                 | Allow from                              |      Port | Purpose                       |
| -------------------- | --------------------------------------- | --------: | ----------------------------- |
| custivio-app         | `<USER_CIDR>`, `<ADMIN_CIDR>`           |       443 | HTTPS app access              |
| custivio-app         | `<USER_CIDR>`                           |        80 | Optional redirect to HTTPS    |
| custivio-app         | localhost/private proxy only            |      3000 | Fastify API                   |
| custivio-data        | `<APP_PRIVATE_IP>`, `<BACKUP_ADMIN_IP>` |      5432 | PostgreSQL                    |
| custivio-data        | `<APP_PRIVATE_IP>`, `<BACKUP_ADMIN_IP>` |      9000 | MinIO API                     |
| custivio-data        | `<ADMIN_CIDR>`                          |      9001 | Optional MinIO console        |
| custivio-data        | `<APP_PRIVATE_IP>`                      |      6379 | Valkey                        |
| shared-observability | `<ADMIN_CIDR>`                          |       443 | Grafana HTTPS                 |
| shared-observability | `<APP_PRIVATE_IP>`                      | 4317,4318 | OTel ingest                   |
| shared-observability | private only                            | 9090,3100 | Prometheus and Loki internals |
| all nodes            | `<ADMIN_CIDR>`                          |        22 | SSH                           |
