# Custivio Customer Pilot Plan

Report date: 2026-05-23

Pilot readiness: PARTIAL

Reason: product is release-candidate ready, but staging deployment, backup/restore rehearsal, and seven-persona staging walkthrough remain external pending.

## Pilot Goal

Validate Custivio with a small customer team using real inventory data, real roles, and real operating workflows before wider rollout.

## Pilot Defaults

| Area                | Default                                                  |
| ------------------- | -------------------------------------------------------- |
| Duration            | 2 weeks                                                  |
| Users               | 1 admin, 1 asset manager, 1 store user, 1 auditor        |
| Data volume         | 50-100 real assets                                       |
| Stock scope         | 1 stock receive/issue workflow                           |
| Audit scope         | 1 audit campaign                                         |
| Import/export scope | 1 import and 1 export flow                               |
| Deployment          | Proxmox staging                                          |
| Support cadence     | Daily check-in during week 1, twice-weekly during week 2 |

## In Scope

- Login/logout/session behavior.
- Admin user and role setup.
- Catalog and location setup.
- Asset create/edit/detail/search.
- Attachment upload/download/delete.
- Stock receive/issue.
- Custody checkout/checkin/handover if customer uses custody.
- One transfer decision workflow if customer uses approvals.
- Maintenance/warranty record creation if applicable.
- One audit campaign and scan.
- Import/export validation.
- Backup capture and restore rehearsal before pilot data is trusted.

## Out Of Scope

- New product features.
- Custom integrations.
- Paid SaaS services.
- Provider-specific cloud automation beyond the documented Oracle showcase path.
- Production cutover.
- Exact upload percentage progress; current upload UX remains accepted for pilot.

## Feedback Form

| Field                | Required        |
| -------------------- | --------------- |
| Reporter             | Yes             |
| Persona              | Yes             |
| Feature area         | Yes             |
| Steps to reproduce   | Yes for defects |
| Expected result      | Yes for defects |
| Actual result        | Yes for defects |
| Screenshot/video     | Recommended     |
| Severity             | Yes             |
| Business impact      | Yes             |
| Workaround available | Yes/No          |

## Issue Severity Levels

| Severity | Definition                                                             | Response                                                                                       |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P0       | Outage, security issue, data loss, or cannot login for all pilot users | Stop pilot, preserve logs, execute rollback/restore decision.                                  |
| P1       | Core workflow blocked for a pilot role                                 | Triage same day; fix or provide approved workaround before expanding pilot.                    |
| P2       | Usability, reporting, slow workflow, or non-critical defect            | Track for pilot hardening; does not block pilot continuation unless cumulative impact is high. |
| P3       | Enhancement or future workflow request                                 | Record for roadmap; no pilot commitment.                                                       |

## Rollback Plan

1. Stop pilot writes.
2. Export pilot issue evidence and any required customer reports.
3. Capture current backup artifacts.
4. Roll back app release using Proxmox rollback script if app regression is confirmed.
5. Restore staging data only if data corruption or destructive test requires it.
6. Preserve API, worker, DB, reverse proxy, and browser UAT logs.
7. Reopen pilot only after validation passes.

## Success Criteria

- Four pilot users complete assigned workflows.
- 50-100 assets are loaded and searchable.
- Stock workflow completes without duplicate or missing ledger entries.
- Audit campaign completes and findings are understandable.
- Import/export flow is usable by customer operator.
- No P0 or unresolved P1 issues remain.
- Customer owner accepts readiness for expanded UAT or production planning.
