# Custivio Customer Release Candidate Plan

Report date: 2026-05-23

## Objective

Convert the current real-user UAT readiness state into customer release candidate readiness by proving customer-facing workflows, persona coverage, realistic data volume behavior, upload/low-network behavior, backup/restore preparedness, staging deployment preparedness, and customer documentation.

## Scope

- Keep backend business logic stable unless a real product bug is found.
- Expand browser-click Playwright coverage for customer-critical mutations.
- Use UAT/dev-only data generation for volume checks; do not pollute production seed.
- Treat staging deployment and backup/restore as external execution unless a safe environment is available.
- Produce customer-ready admin, asset manager, store user, auditor, manager, import/export, and troubleshooting guides.

## Phases

1. Control docs and release task board.
2. Seven-persona browser/manual UAT.
3. Expanded Playwright browser-click mutation coverage.
4. Real data volume test and report.
5. Upload progress decision and low-network proof.
6. Staging deployment rehearsal checklist.
7. Backup/restore rehearsal runbook/result.
8. Customer documentation.
9. Final validation and customer release audit.

## Release Candidate Criteria

- Seven-persona walkthrough is complete or explicitly environment-blocked.
- Browser-click tests cover the core customer mutation paths.
- Real data volume report exists and records realistic customer data behavior.
- Upload and low-network UX are acceptable and documented.
- Backup/restore and staging deployment are rehearsed or explicitly marked external pending with exact runbooks.
- Customer guides exist for the main roles and workflows.
- Final validation has no unresolved P0/P1 blockers.
