# Engineering Docs Index

Report date: 2026-05-16

This is the current reading order for backend, frontend, QA, and deployment teams. Historical migration/audit documents are kept for traceability but are not the primary implementation guide.

## Start Here

| Audience           | Read first                                                                                                                    | Purpose                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Backend engineers  | `AGENTS.md`, `README.md`, `docs/engineering/PROJECT_PROGRESS.md`                                                              | Current backend-only Fastify rules and progress                  |
| Frontend engineers | `docs/engineering/FRONTEND_HANDOFF.md`, `docs/engineering/FRONTEND_TEST_DATA.md`, `docs/engineering/FRONTEND_API_EXAMPLES.md` | API base URL, auth flow, UAT users, seeded records, and examples |
| QA/UAT             | `docs/engineering/TESTING_GATES.md`, `docs/engineering/api-smoke.http`, `docs/QA/UAT_SIGNOFF.md`                              | Automated gates and manual smoke/UAT entry points                |
| Operations         | `docs/operations/PRODUCTION_DEPLOYMENT.md`, `docs/operations/RELEASE_CHECKLIST.md`, `docs/operations/ROLLBACK.md`             | Deployment, release, and rollback flow                           |

## Current Contract Docs

- `docs/engineering/API_CONTRACT.md`: frontend-facing API contract and error shapes.
- `docs/engineering/FRONTEND_HANDOFF.md`: frontend integration notes, cookies, OpenAPI, modules ready.
- `docs/engineering/FRONTEND_TEST_DATA.md`: local-only UAT credentials and seeded record keys.
- `docs/engineering/FRONTEND_API_EXAMPLES.md`: curl examples for auth, assets, attachments, stock, maintenance, audits, imports, and exports.
- `docs/engineering/api-smoke.http`: simple HTTP collection for manual API smoke testing.

## Governance And Engineering Rules

- `docs/engineering/FOLDER_AND_BOUNDARY_RULES.md`
- `docs/engineering/DB_DRIZZLE_RULES.md`
- `docs/engineering/BACKEND_API_RULES.md`
- `docs/engineering/ESLINT_AND_CODE_QUALITY.md`
- `docs/engineering/FEATURE_IMPLEMENTATION_WORKFLOW.md`
- `docs/engineering/TESTING_GATES.md`

## Backend Completion Tracking

- `docs/engineering/backend-completion/BACKEND_COMPLETION_MASTER_PLAN.md`
- `docs/engineering/backend-completion/BACKEND_COMPLETION_TASK_BOARD.md`
- `docs/engineering/backend-completion/BACKEND_COMPLETION_PROGRESS.md`
- `docs/engineering/backend-completion/TEST_RUN_LOG.md`
- `docs/engineering/backend-completion/CLEANUP_PLAN.md`
- `docs/engineering/backend-completion/CLEANUP_MANIFEST.md`
- `docs/engineering/backend-completion/FINAL_BACKEND_READY_CHECKLIST.md`
- `docs/engineering/backend-completion/FRONTEND_DATA_FLOW_READINESS.md`

## Operations Docs

- `docs/operations/PRODUCTION_DEPLOYMENT.md`
- `docs/operations/OFFLINE_RELEASE_BUNDLE.md`
- `docs/operations/BACKUP_RESTORE.md`
- `docs/operations/BACKUP_RESTORE_REHEARSAL.md`
- `docs/operations/AIR_GAP_DEPLOYMENT.md`
- `docs/operations/OBSERVABILITY_AND_ALERTS.md`
- `docs/operations/SECURITY_HARDENING.md`
- `docs/operations/ADMIN_GUIDE.md`
- `docs/operations/USER_GUIDE.md`
- `docs/operations/RELEASE_CHECKLIST.md`
- `docs/operations/ROLLBACK.md`

## Feature Notes

Feature notes are implementation history and module behavior references:

- `docs/engineering/features/02-database-foundation.md`
- `docs/engineering/features/03-auth-rbac-tenant-isolation.md`
- `docs/engineering/features/04-asset-catalog.md`
- `docs/engineering/features/05-asset-registry.md`
- `docs/engineering/features/06-stock-and-consumables.md`
- `docs/engineering/features/07-custody-movement-maintenance.md`
- `docs/engineering/features/08-audit-import-export-reporting.md`
- `docs/engineering/features/09-production-hardening.md`

## Historical Reference

Keep these for traceability unless a future cleanup task explicitly approves archival or deletion:

- `docs/engineering/backend-migration/**`
- `docs/engineering/BACKEND_INFRA_DB_SHIP_READINESS_AUDIT.md`
- `docs/engineering/BACKEND_ONLY_FASTIFY_SHIP_READINESS_AUDIT.md`
- `docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT.md`
- `docs/engineering/cleanup/PHASE_1_CLEANUP_REPORT.md`
