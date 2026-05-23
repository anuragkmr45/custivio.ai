# Custivio Staging Execution Plan

Report date: 2026-05-23

Primary path: Proxmox staging

Secondary path: Oracle Always Free showcase VM

Execution status: EXTERNAL_PENDING

## Goal

Deploy the current customer release candidate into a customer-like staging environment, validate it with real browser flows, rehearse backup/restore, and decide whether to open a controlled pilot.

## Required External Inputs

| Input                                   | Required for                   | Status           | Notes                                                    |
| --------------------------------------- | ------------------------------ | ---------------- | -------------------------------------------------------- |
| Staging domain                          | Proxmox and Oracle             | EXTERNAL_PENDING | Example: `custivio-staging.example.com`.                 |
| TLS certificate path or ACME capability | Proxmox and Oracle             | EXTERNAL_PENDING | HTTPS is required for production cookie settings.        |
| Proxmox host access                     | Primary path                   | EXTERNAL_PENDING | Requires admin/operator access.                          |
| App LXC IP                              | Primary path                   | EXTERNAL_PENDING | Public only through reverse proxy.                       |
| Data VM IP                              | Primary path                   | EXTERNAL_PENDING | Private network only.                                    |
| Observability node IP                   | Optional                       | EXTERNAL_PENDING | Required only if staging metrics dashboards are enabled. |
| Oracle VM public IP                     | Secondary path                 | EXTERNAL_PENDING | Only for cloud showcase.                                 |
| SMTP/provider decisions                 | Pilot notifications if enabled | EXTERNAL_PENDING | Not required for core pilot.                             |
| Pilot admin email                       | Bootstrap                      | EXTERNAL_PENDING | Must not use default credentials.                        |
| Strong bootstrap password               | Bootstrap                      | EXTERNAL_PENDING | Must satisfy production password policy.                 |

## Execution Phases

| Phase | Target          | Action                                       | Exit criteria                                                                   |
| ----- | --------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| 1     | Repo            | Confirm release freeze                       | Git status recorded, validation commands pass, RC commit selected.              |
| 2     | Proxmox data VM | Install PostgreSQL, MinIO, Valkey            | Private services are reachable only from app LXC.                               |
| 3     | Proxmox app LXC | Install API, worker, frontend, reverse proxy | `/api/health/live` and frontend HTTPS respond.                                  |
| 4     | Database        | Run migrations and bootstrap admin           | Admin login works; no default production credentials.                           |
| 5     | Observability   | Validate metrics/OTel path                   | Metrics scrape path works or is explicitly deferred.                            |
| 6     | Browser UAT     | Run seven-persona staging walkthrough        | All personas pass or blockers recorded.                                         |
| 7     | Backup/restore  | Execute clean restore rehearsal              | Restored staging clone verifies login, assets, attachments, stock, and reports. |
| 8     | Pilot           | Open controlled pilot                        | Pilot checklist accepted by owner.                                              |

## Go/No-Go Gates

- No feature blockers.
- No security blockers.
- Staging HTTPS, CORS, cookies, DB, MinIO, and Valkey validated.
- Backup artifacts captured before pilot.
- Restore rehearsal completed in a clean staging clone.
- Seven-persona staging walkthrough completed.
- Pilot owner accepts scope and rollback plan.
