# Custivio Final Go No-Go Report

Report date: 2026-05-23

Release candidate status: READY_FOR_STAGING

Feature blockers: 0

Deployment blockers: 0 for documentation and local validation; external staging execution pending

Backup/restore blockers: 0 for runbook readiness; external restore rehearsal pending

Security blockers: 0

Pilot readiness: PARTIAL

Recommended next action: provision Proxmox staging, deploy the release candidate, run seven-persona staging walkthrough, execute backup/restore rehearsal in a clean staging clone, then open the controlled pilot.

## Complete

| Area                      | Status           | Evidence                                                                                          |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| Product release candidate | COMPLETE         | Customer release audit reports 95% and customer release candidate ready.                          |
| Feature/browser readiness | COMPLETE         | Browser-click UAT passed locally with customer-critical mutation coverage.                        |
| Persona readiness         | COMPLETE_LOCALLY | Seven personas passed local browser UAT.                                                          |
| Customer docs             | COMPLETE         | Customer role and troubleshooting guides exist.                                                   |
| Proxmox deployment assets | COMPLETE         | Proxmox runbook, validation scripts, release scripts, backup scripts, and rollback scripts exist. |
| Cloud showcase docs       | COMPLETE         | Oracle Always Free path exists as secondary showcase option.                                      |
| Local validation          | COMPLETE         | Backend, frontend, browser UAT, Proxmox, and observability validation passed.                     |

## Pending

| Area                              | Status           | Required action                                                       |
| --------------------------------- | ---------------- | --------------------------------------------------------------------- |
| Staging deployment execution      | EXTERNAL_PENDING | Provide Proxmox host, app LXC/data VM details, DNS, TLS, and secrets. |
| Staging seven-persona walkthrough | EXTERNAL_PENDING | Run browser or manual walkthrough against staging URL.                |
| Backup/restore rehearsal          | EXTERNAL_PENDING | Execute destructive restore only in a clean staging clone.            |
| Cloud/provider deployment         | OPTIONAL_PENDING | Execute only if the customer wants an Oracle showcase environment.    |

## Exact Commands To Run Next

Local validation before handoff:

```bash
cd custivio
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
bash deploy/proxmox/scripts/validate-all.sh

cd ../custivio-web
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:browser

cd ../shared-observability
bash scripts/validate-config.sh
```

Proxmox deployment:

```bash
cd custivio
bash deploy/proxmox/custivio-release/build-release-bundle.sh <version>
bash deploy/proxmox/custivio-release/verify-release-bundle.sh dist/custivio-<version>.tar.gz
bash deploy/proxmox/custivio-app-lxc/deploy-release.sh dist/custivio-<version>.tar.gz <version>
```

Production-like bootstrap:

```bash
BOOTSTRAP_TENANT_SLUG=<slug> \
BOOTSTRAP_TENANT_NAME=<name> \
BOOTSTRAP_ADMIN_EMAIL=<email> \
BOOTSTRAP_ADMIN_NAME=<name> \
BOOTSTRAP_ADMIN_PASSWORD=<strong-password> \
pnpm db:bootstrap-admin
```

Staging browser UAT:

```bash
cd custivio-web
E2E_FRONTEND_BASE_URL=https://<staging-domain> \
E2E_API_BASE_URL=https://<staging-domain> \
E2E_ADMIN_EMAIL=<admin-email> \
E2E_PASSWORD=<password> \
npm run test:browser
```

## Environment Info Needed

- Proxmox host and admin access.
- App LXC hostname/IP.
- Data VM hostname/IP.
- Staging DNS name.
- TLS certificate or ACME setup.
- Backend env file with DB, Valkey, MinIO, session, CORS, and telemetry secrets.
- Frontend API base URL.
- Backup storage path and retention decision.
- Pilot admin email and strong password.

## Customer Pilot Decision

Customer pilot can start after:

1. Proxmox staging is deployed.
2. HTTPS, CORS, secure cookies, DB, MinIO, Valkey, and worker paths are validated.
3. Backup artifacts are captured.
4. Restore rehearsal passes in a clean staging clone.
5. Seven-persona staging walkthrough passes.

Current decision: do not start the customer pilot yet; start staging execution.

## Final Validation Results

| Area          | Command                                       | Result          | Notes                                                                                                                                                              |
| ------------- | --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend       | `pnpm check`                                  | PASS            | Non-DB backend gates passed.                                                                                                                                       |
| Backend       | `pnpm build:api`                              | PASS            | API build passed.                                                                                                                                                  |
| Backend       | `pnpm test:api`                               | PASS            | 37 API tests passed.                                                                                                                                               |
| Backend DB    | `RUN_DB_TESTS=1 pnpm test`                    | PASS_WITH_NOTES | Initial run failed because PostgreSQL/Valkey were not running; after starting local Compose services and running migrations/seeds, 103 tests passed and 1 skipped. |
| Proxmox       | `bash deploy/proxmox/scripts/validate-all.sh` | PASS            | Proxmox asset validation passed.                                                                                                                                   |
| Frontend      | `npm run lint`                                | PASS            | Passed after test-only browser helper stabilization.                                                                                                               |
| Frontend      | `npm run typecheck`                           | PASS            | Passed after test-only browser helper stabilization.                                                                                                               |
| Frontend      | `npm run test`                                | PASS            | 27 frontend unit tests passed.                                                                                                                                     |
| Frontend      | `npm run build`                               | PASS            | Vite build passed.                                                                                                                                                 |
| Browser UAT   | `npm run test:browser`                        | PASS_WITH_NOTES | Initial run exposed a flaky login-helper retry boundary; after test-only stabilization, 10 browser tests passed in 2.3 minutes.                                    |
| Observability | `bash scripts/validate-config.sh`             | PASS            | Shared observability validation passed.                                                                                                                            |

Final local validation result: PASS_WITH_NOTES.

Blocking issues found: 0.
