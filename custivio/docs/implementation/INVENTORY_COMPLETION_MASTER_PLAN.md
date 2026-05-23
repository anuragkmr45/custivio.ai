# Custivio Inventory Completion Master Plan

Report date: 2026-05-22

## Goal

Finish Custivio as a real-data inventory and IT asset management product ready for full product QA, Proxmox/on-prem staging, and a free cloud showcase deployment.

## Execution Rules

- Backend API contract is the source of truth.
- Backend business logic changes are limited to proven API contract, security, rate-limit, or already-modeled field exposure gaps.
- Frontend data access must go through `custivio-web/src/lib/api`.
- Browser API requests must use cookie auth with `credentials: "include"`.
- No production auth/session state may be stored in localStorage.
- Do not mark a task complete until relevant tests pass or the failure is documented as environment-only.
- Update `INVENTORY_COMPLETION_TASK_BOARD.md`, `INVENTORY_COMPLETION_PROGRESS.md`, and `INVENTORY_COMPLETION_TEST_LOG.md` after each implementation phase.

## Phases

| Phase | Name                                    | Completion target                                                                              |
| ----: | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
|     0 | Control docs and baseline validation    | Required docs exist and current validation blockers are classified.                            |
|     1 | OpenAPI types and contract drift        | Frontend generated types are not placeholder and contract checks fail on drift.                |
|     2 | API client hardening                    | Central client handles JSON, uploads, downloads, request IDs, retry-after, and typed error UX. |
|     3 | Auth and permissions                    | Protected pages require session and display consistent 401/403 behavior.                       |
|     4 | Backend production controls             | Route control matrix has no P0/P1 gaps; rate limits are targeted and tested where needed.      |
|     5 | Asset create/edit                       | UI supports backend-accepted asset fields and realistic UAT asset creation.                    |
|     6 | Custody handover                        | Handover requires explicit target user and rejects same-user handover.                         |
|     7 | Import/export/report UX                 | Import/export flows are not hardcoded demo payloads and support job status/download.           |
|     8 | Admin/catalog/location polish           | Prompt-based critical workflows are replaced with forms/dialogs.                               |
|     9 | Dashboard/tables/search/QR/placeholders | UAT-critical UI has real data or clear disabled states; no fake operational data.              |
|    10 | Cleanup and branding                    | Stale mock/localStorage/old-brand active paths are removed or quarantined.                     |
|    11 | Product UAT                             | End-to-end product smoke and QA checklist are updated with results.                            |
|    12 | Cloud showcase prep                     | Free showcase docs and env examples exist.                                                     |
|    13 | Load balancing and production docs      | Proxmox and reverse-proxy docs explain shared services, cookies, CORS, TLS, and health checks. |
|    14 | Final validation                        | Backend, frontend, observability, deployment, and smoke checks are recorded.                   |
|    15 | Final readiness audit                   | Readiness score and remaining blockers/gaps are documented.                                    |

## Completion Criteria

- Remaining P0 blockers: 0.
- Remaining P1 blockers: 0, unless explicitly classified as environment-only with operator action.
- OpenAPI frontend types are generated or derived from real backend OpenAPI.
- Asset create/edit, custody handover, import/export, and protected route behavior are usable in UAT.
- Proxmox validation and shared observability validation pass or have environment-only notes.
- Cloud showcase documentation is present with limitations and validation steps.
