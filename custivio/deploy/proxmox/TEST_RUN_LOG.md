# Proxmox Deployment Test Run Log

| Date       | Command                                                                                  | Result | Notes                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| 2026-05-18 | Generated Proxmox deployment scaffold                                                    | PASS   | Files created under `deploy/proxmox` and `../shared-observability`                                         |
| 2026-05-18 | `bash custivio/deploy/proxmox/scripts/validate-all.sh`                                   | PASS   | App LXC, Data VM, release bundle, firewall docs, operator docs, and shared observability validation passed |
| 2026-05-18 | `bash shared-observability/scripts/validate-config.sh`                                   | PASS   | Shared observability config and target labels passed                                                       |
| 2026-05-18 | `DATA_ENV_FILE=data-vm.env.example docker compose -f docker-compose.data.yml config`     | PASS   | Data VM Compose config rendered with example env                                                           |
| 2026-05-18 | `GRAFANA_ENV_FILE=env.example docker compose -f docker-compose.observability.yml config` | PASS   | Shared observability Compose config rendered with example env                                              |
