# Full System QA Master Plan

Report date: 2026-05-17

## Goal

Prove the inventory platform is ready for product-owner survey by running three gates in order:

1. Dev verification.
2. QA environment verification.
3. Product-owner/UAT survey.

Backend APIs are tested before frontend workflows. Existing automated scripts are required gates, but they are not sufficient by themselves; every API group and every user-facing workflow also has explicit matrix coverage.

Use these statuses everywhere: `PENDING`, `PASS`, `FAIL`, `BLOCKED`, `ACCEPTED_RISK`.

## Environment Order

| Gate | Environment | Entry criteria | Exit criteria | Evidence files |
|---|---|---|---|---|
| Dev API | Local dev backend | Docker dependencies available; UAT seed can run | Backend scripts pass; API matrix has no P0/P1 failures | `DEV_TEST_RUN_LOG.md`, `DEV_API_TEST_MATRIX.md`, `DEV_DEFECT_LOG.md` |
| Dev frontend | Local frontend against local API | Dev API gate passes | Frontend scripts pass; UI matrix has no P0/P1 failures | `DEV_TEST_RUN_LOG.md`, `DEV_FRONTEND_TEST_MATRIX.md`, `DEV_DEFECT_LOG.md` |
| QA | Local Docker QA | Dev gate passes; isolated QA services can run locally | QA matrices pass or have accepted residual risk | `QA_ENVIRONMENT_RUNBOOK.md`, `QA_TEST_RUN_LOG.md`, `QA_API_TEST_MATRIX.md`, `QA_FRONTEND_TEST_MATRIX.md`, `QA_DEFECT_LOG.md` |
| Product owner | QA environment | QA gate passes | Product-owner survey verdict is ready or gaps are documented | `PRODUCT_OWNER_SURVEY_UAT.md`, `FINAL_FULL_SYSTEM_READINESS_AUDIT.md` |

## Dev Backend Preflight

Before product API verification, confirm:

- Docker Desktop/daemon is running and accessible.
- Ports are available or intentionally overridden.
- Expected local API port is `3002`.
- Postgres, Valkey, and MinIO can start through `pnpm docker:dev`.

If Docker or dependencies are unavailable, mark dependency-backed API and UI rows as `BLOCKED`, not `FAIL`.

## Dev Backend Commands

Run from `custivio/`.

```bash
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm db:seed:uat
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
pnpm smoke:api
API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start
```

Expected local API URLs:

- API: `http://localhost:3002`
- Health: `http://localhost:3002/api/health/live`
- OpenAPI: `http://localhost:3002/api/openapi.json`
- Docs: `http://localhost:3002/api/docs`

## Manual API Matrix Coverage

The dev API matrix must explicitly cover:

- Health, readiness, ops, metrics, OpenAPI, Swagger.
- Auth/session: login, `/me`, logout, invalid credentials, rate limit.
- Admin users, roles, assignments, and permission denial.
- Catalog and locations.
- Assets and attachments.
- Stock units/items/movements with idempotency replay and conflict.
- Custody and transfers.
- Maintenance and warranty.
- Audits, imports, reports, exports, saved filters, worker job states.
- Negative cases: `401`, `403`, `400`, `404`, `409`, `429`, bad IDs, bad payloads, bad upload, and CORS from `http://localhost:8080`.

## Dev Frontend Commands

Run from `custivio-web/`.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Expected local frontend URL:

- Frontend: `http://localhost:8080`
- API base: `VITE_API_BASE_URL=http://localhost:3002`

Frontend product and E2E verification starts only after backend readiness passes. Static frontend checks can run earlier as informational gates.

## Manual Frontend Matrix Coverage

Verify with admin, manager, store, and auditor users:

- Login, logout, refresh/session restore.
- Backend unavailable message.
- Dashboard and status pages.
- Admin users/roles/assignments.
- Catalog and locations.
- Asset search/create/edit/detail/lifecycle.
- Attachment upload/download/delete.
- Stock movement double-submit/idempotency behavior.
- Custody checkout/checkin/handover.
- Transfers approve/reject.
- Maintenance ticket/status/warranty.
- Audits, imports, reports, exports, saved filters.
- `401` redirect, `403` access denied, permission-aware navigation.
- Mobile and desktop layout.
- Clean-browser hydration check, excluding extension-injected attributes.

## Defect Fix Protocol

No implementation change is allowed until the defect is reproducible and root cause is proven.

1. Reproduce the failure twice.
2. Confirm expected behavior against backend contract, source code, logs, or API response.
3. Record it in the relevant defect log.
4. Mark `Root cause status` as `PROVEN`.
5. Fix the smallest safe scope.
6. Rerun impacted tests and a broader regression gate.
7. Update test logs and readiness audit.

Backend changes are out of scope unless a backend API contract mismatch is proven.

## QA Gate

The current QA gate uses a local Docker QA environment:

```bash
QA_API_BASE_URL=http://localhost:3003
QA_FRONTEND_BASE_URL=http://localhost:8081
QA_TENANT_SLUG=default
```

QA checks include clean migrations/UAT seed, CORS/cookie behavior for QA domains, file upload/download through backend only, worker-backed imports/exports, OpenAPI/Swagger availability, request IDs in failures, and no direct MinIO/Valkey/backend internals in frontend. If a remote QA deployment is provided later, replay the same matrix with those URLs and record it as a separate QA run.

## Severity

| Severity | Meaning | Release impact |
|---|---|---|
| P0 | Data loss, auth bypass, app unusable, critical workflow impossible | Blocks all gates |
| P1 | Core module broken, wrong permissions, file/job flow broken | Blocks dev/QA readiness |
| P2 | Important workflow issue with workaround | Can pass only with accepted risk |
| P3 | Cosmetic, copy, minor UX issue | Does not block readiness |
