# Backend Completion Cleanup Manifest

Report date: 2026-05-16

## Scope

This manifest records cleanup performed during backend-completion Phase 1. Cleanup is intentionally conservative: source code, migrations, tests, infra config, package manifests, and active docs were kept unless a file was clearly generated junk or a legacy runtime artifact that had already passed API parity gates.

## Files Quarantined

| Path                                                  | Classification | Reason                                                                                                                                             | Reference check                                                                                                                                                                                                  |
| ----------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_cleanup_review/backend-completion/apps-web-legacy/` | QUARANTINE     | Legacy Next.js web/API runtime was removed from active workspace after Fastify route parity, API tests, DB tests, and Docker dev gates had passed. | Active manifests/scripts no longer reference `@custivio/web`, `apps/web/package.json`, or `pnpm --filter @custivio/web`. Historical docs still mention the old runtime and are kept for Phase 9 archival review. |

## Files Deleted

| Path                                                                      | Classification | Reason                                                                |
| ------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------- |
| `_cleanup_review/backend-completion/apps-web-legacy/.next/`               | DELETE         | Generated Next.js build/dev output.                                   |
| `_cleanup_review/backend-completion/apps-web-legacy/tsconfig.tsbuildinfo` | DELETE         | Generated TypeScript incremental build artifact.                      |
| `_cleanup_review/backend-completion/apps-web-legacy/node_modules/`        | DELETE         | Installed dependency output; not source and not useful in quarantine. |

## Files Kept

| Path                                           | Classification                | Reason                                                                                                                               |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/**`                                  | KEEP_CURRENT                  | Active Fastify backend runtime.                                                                                                      |
| `packages/**`                                  | KEEP_CURRENT                  | Shared backend, database, auth, cache, config, storage, and telemetry packages.                                                      |
| `packages/db/src/migrations/**`                | KEEP_CURRENT                  | Required Drizzle migrations.                                                                                                         |
| `infra/**`                                     | KEEP_CURRENT                  | Docker, Prometheus, Grafana, OTel, and MinIO configuration.                                                                          |
| `tests/**` and `apps/api/src/tests/**`         | KEEP_CURRENT                  | Required verification coverage.                                                                                                      |
| `docs/engineering/**` and `docs/operations/**` | KEEP_CURRENT / KEEP_REFERENCE | Active governance, API, migration, audit, and operations docs. Some historical Next.js references remain for Phase 9 cleanup review. |

## Phase 9 Cleanup Review

| Path or class                                                | Classification              | Reason                                                                                                        |
| ------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.DS_Store`, `__MACOSX`, `*.tmp`, `*.bak`, `*.old`, `*.orig` | DELETE candidate            | Scan found no matching files inside `custivio`.                                                               |
| Reference repositories / `repo-audit` folders                | DELETE/QUARANTINE candidate | Scan found none inside `custivio`.                                                                            |
| Empty directories/placeholders                               | KEEP_CURRENT                | Scan found no empty active directories outside ignored dependency/quarantine areas.                           |
| `docs/engineering/backend-migration/**`                      | KEEP_REFERENCE              | Referenced by historical audits and migration completion evidence; not deleted.                               |
| Older readiness audits                                       | KEEP_REFERENCE              | Kept as historical evidence until post-completion audit supersedes them.                                      |
| `_cleanup_review/backend-completion/apps-web-legacy/`        | QUARANTINE                  | Kept outside active workspace as rollback/reference evidence until final readiness audit and handoff signoff. |
| `docs/engineering/PROJECT_PROGRESS.md`                       | KEEP_CURRENT                | Rewritten to remove stale Next.js active-runtime file lists and point to backend-only status.                 |
| `docs/engineering/DOCS_INDEX.md`                             | KEEP_CURRENT                | Added as the canonical docs reading order for handoff.                                                        |

## Tests Run After Cleanup

| Command                                  | Result | Notes                                                                       |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------- |
| `pnpm check:forbidden`                   | PASS   | `_cleanup_review` is ignored by the forbidden dependency checker.           |
| `pnpm check`                             | PASS   | Passed after stale Next.js security-header test was updated to hit Fastify. |
| `pnpm build:api`                         | PASS   | API build passed.                                                           |
| `pnpm test:api`                          | PASS   | API tests passed.                                                           |
| `env RUN_DB_TESTS=1 pnpm test`           | PASS   | Passed with local DB access allowed.                                        |
| `docker build -f infra/Dockerfile.api .` | PASS   | API image built without `apps/web` copy steps.                              |

## Remaining Cleanup Risks

- Historical docs under `docs/engineering/backend-migration`, older audit reports, and some feature notes still mention the old `apps/web` runtime. They are retained as reference and listed in `docs/engineering/DOCS_INDEX.md`.
- Quarantined `apps-web-legacy` remains outside active workspace for rollback/reference during backend-completion. It can be deleted only after final readiness audit and handoff signoff.
