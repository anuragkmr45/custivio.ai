# Custivio Staging Deployment Rehearsal Checklist

Report date: 2026-05-23

Staging deployment readiness: EXTERNAL_PENDING

No external staging URL, VM, or customer-like network boundary was provided in this workspace. The checklist below is ready for the operator to execute on a staging machine.

| Area              | Required Check                                                        | Status           | Evidence / Notes                                                     |
| ----------------- | --------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| App URL           | Frontend URL resolves over HTTPS                                      | EXTERNAL_PENDING | Record final staging URL.                                            |
| API URL           | Backend API resolves over HTTPS                                       | EXTERNAL_PENDING | Verify `/api/health/live`, `/api/health/ready`, `/api/openapi.json`. |
| HTTPS             | TLS certificate valid and trusted                                     | EXTERNAL_PENDING | Required for secure cookies across domains.                          |
| CORS              | Frontend origin present in backend allowed origins                    | EXTERNAL_PENDING | Verify credentialed browser requests.                                |
| Secure cookie     | Session cookie uses production-safe settings                          | EXTERNAL_PENDING | Same-site/subdomain setup must match deployment topology.            |
| DB private        | PostgreSQL not exposed publicly                                       | EXTERNAL_PENDING | Only API/worker network should reach DB.                             |
| MinIO private     | Object storage console/API private except approved reverse proxy      | EXTERNAL_PENDING | Attachment upload/download should go through API authorization.      |
| Valkey private    | Cache/lock/rate-limit service private                                 | EXTERNAL_PENDING | No public port exposure.                                             |
| Frontend env      | `VITE_API_BASE_URL` points to staging API                             | EXTERNAL_PENDING | Rebuild frontend after env changes.                                  |
| Backend env       | Database, Valkey, MinIO, CORS, session, telemetry envs set            | EXTERNAL_PENDING | Use `.env.example` and cloud/on-prem docs.                           |
| Migrations        | `pnpm db:migrate` succeeds                                            | EXTERNAL_PENDING | Run before bootstrap/seed.                                           |
| Bootstrap         | First tenant/admin created by safe bootstrap CLI or UAT seed for demo | EXTERNAL_PENDING | No default production admin credentials.                             |
| Admin login       | Admin can login/logout                                                | EXTERNAL_PENDING | Verify current session and 401 after logout.                         |
| Upload/download   | Asset attachment upload/download/delete works                         | EXTERNAL_PENDING | Confirms API plus MinIO path.                                        |
| Worker jobs       | Import processing and export creation/download works                  | EXTERNAL_PENDING | Confirms worker/runtime paths.                                       |
| Metrics           | Metrics endpoint and observability scrape path verified               | EXTERNAL_PENDING | Prefer private/admin access.                                         |
| Backup            | Staging backup captured                                               | EXTERNAL_PENDING | Store artifact path and checksum.                                    |
| Restore rehearsal | Restore into clean staging clone verified                             | EXTERNAL_PENDING | See backup/restore rehearsal runbook.                                |

## Execution Notes

1. Deploy backend, worker, PostgreSQL, MinIO, Valkey, and reverse proxy using the Proxmox or Docker staging docs.
2. Run migrations.
3. Create a first admin using `pnpm db:bootstrap-admin` for production-like staging, or run UAT seed only for demo staging.
4. Build frontend with the staging API URL.
5. Execute the browser UAT suite against staging by setting `E2E_FRONTEND_BASE_URL` and `E2E_API_BASE_URL`.
6. Record URLs, timestamps, command output, and screenshots in this file before customer handoff.
