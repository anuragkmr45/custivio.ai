# Custivio Release Candidate Freeze Check

Report date: 2026-05-23

Release candidate status: READY_AFTER_COMMIT

Primary staging target: Proxmox

Automatic tag created: No

## Freeze Summary

| Area                          | Status                   | Evidence                                                                                                            | Notes                                                                                                                        |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Backend repo `custivio/`      | CLEAN_BEFORE_FREEZE_DOCS | `git -C custivio status --short` returned no changes before this pass                                               | This readiness pass adds release-control docs that must be committed before tagging.                                         |
| Frontend repo `custivio-web/` | CLEAN_BEFORE_FREEZE_DOCS | `git -C custivio-web status --short` returned no changes before this pass                                           | This readiness pass adds staging persona walkthrough docs that must be committed before tagging.                             |
| Shared observability          | PARENT_WORKSPACE_TRACKED | `git -C shared-observability rev-parse --show-toplevel` resolves to `/Users/anuragkumar/Desktop/inventory-research` | It is not an isolated nested git repo in this workspace. Parent workspace has unrelated cleanup/history changes.             |
| Env/secrets                   | PASS                     | `.env` is git-ignored in backend and frontend; `.env.example` and `.env.cloud-showcase.example` remain trackable    | Do not commit real `.env` files.                                                                                             |
| Backend lockfile              | PASS                     | `custivio/pnpm-lock.yaml`                                                                                           | Backend package manager remains pnpm.                                                                                        |
| Frontend lockfile             | PASS                     | `custivio-web/package-lock.json`                                                                                    | Frontend validation uses npm because package-lock is active. `bun.lock` also exists and should not drive release validation. |
| Customer docs                 | PASS                     | `custivio/docs/customer/*.md`                                                                                       | Admin, asset manager, store user, auditor, manager, import/export, and troubleshooting guides exist.                         |
| Release docs                  | PASS_WITH_NOTES          | `custivio/docs/implementation/*CUSTOMER_RELEASE*`                                                                   | Customer release candidate audit is already at 95%.                                                                          |
| Proxmox docs/scripts          | PASS                     | `custivio/deploy/proxmox/**`                                                                                        | Release, app LXC, data VM, backup, rollback, security, and validation assets exist.                                          |
| Cloud showcase docs           | PASS                     | `custivio/docs/deployment/cloud-showcase/**`                                                                        | Oracle Always Free remains secondary showcase path.                                                                          |

## Validation Results

| Command                                       | Working directory      | Result          | Notes                                                                                                                       |
| --------------------------------------------- | ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                  | `custivio`             | PASS            | Typecheck, lint, format, non-DB tests, and forbidden dependency check passed.                                               |
| `pnpm build:api`                              | `custivio`             | PASS            | API TypeScript build passed.                                                                                                |
| `pnpm test:api`                               | `custivio`             | PASS            | 9 API test files, 37 tests passed.                                                                                          |
| `RUN_DB_TESTS=1 pnpm test`                    | `custivio`             | PASS_WITH_NOTES | Initial run failed because local PostgreSQL/Valkey were down; after `docker compose up -d`, 103 tests passed and 1 skipped. |
| `bash deploy/proxmox/scripts/validate-all.sh` | `custivio`             | PASS            | App LXC, data VM, release bundle, firewall docs, operator docs, and embedded observability checks passed.                   |
| `npm run lint`                                | `custivio-web`         | PASS            | Re-run after browser test stabilization passed.                                                                             |
| `npm run typecheck`                           | `custivio-web`         | PASS            | Re-run after browser test stabilization passed.                                                                             |
| `npm run test`                                | `custivio-web`         | PASS            | 4 files, 27 tests passed.                                                                                                   |
| `npm run build`                               | `custivio-web`         | PASS            | Vite client/server build and postbuild preview entry passed.                                                                |
| `npm run test:browser`                        | `custivio-web`         | PASS_WITH_NOTES | First run exposed a login-helper retry issue; test-only helper was stabilized and full rerun passed 10/10 in 2.3 minutes.   |
| `bash scripts/validate-config.sh`             | `shared-observability` | PASS            | Shared observability validation passed.                                                                                     |

## Local Validation Notes

- Local Docker Compose services were started for DB/browser validation and stopped afterward without removing volumes.
- The browser test stabilization is test-only; no product behavior, API, or schema changed.
- The release candidate is ready for staging after this documentation and test-harness update is committed.

## Human Approval Required Before Tagging

Recommended commands after committing this release-control pass:

```bash
git -C custivio tag -a custivio-rc-2026-05-23 -m "Custivio customer release candidate 2026-05-23"
git -C custivio-web tag -a custivio-web-rc-2026-05-23 -m "Custivio Web customer release candidate 2026-05-23"
```

Do not tag before:

- release-control docs are committed;
- final validation results are recorded in this file and `FINAL_GO_NO_GO_REPORT.md`;
- a human confirms the exact RC version/tag naming.
