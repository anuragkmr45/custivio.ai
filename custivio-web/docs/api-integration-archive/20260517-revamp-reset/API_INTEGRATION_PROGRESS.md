# API Integration Progress

## 2026-05-17

- Started frontend/API integration from `/Users/anuragkumar/Desktop/inventory-research`.
- Confirmed sibling repos exist: `custivio/` and `custivio-web/`.
- Confirmed backend handoff docs report 98% backend/db/infra readiness and frontend can start fully.
- Inspected initial frontend structure: Vite/TanStack Router React app with mock data and localStorage mock auth.
- Created integration control docs before runtime code changes.
- Ran frontend baseline:
  - `bun install` passed after temp/cache escalation.
  - `bun run lint` failed on existing Prettier formatting.
  - `bun run typecheck` and `bun run test` scripts are missing.
  - `bunx tsc --noEmit` failed on `TopBar` navigation to `/login` missing required search params.
  - `bun run build` passed with a non-fatal Wrangler log permission warning.
- Ran backend baseline:
  - Docker dev services are running.
  - `pnpm db:migrate`, `pnpm db:seed`, and `pnpm db:seed:uat` passed.
  - `pnpm check`, `pnpm build:api`, `pnpm test:api`, and escalated `RUN_DB_TESTS=1 pnpm test` passed.

## Central API Client Gate

- Added scripts: `typecheck`, `test`, `test:watch`, and `format:check`.
- Added Vitest.
- Added central API client files under `src/lib/api/`.
- Added API client tests for JSON success, handled errors, request ID, retry-after, query/path params, JSON bodies, FormData upload, blob download, abort signals, and idempotency headers.
- Repaired baseline frontend gates:
  - `bun run test` passes.
  - `bun run typecheck` passes.
  - `bun run lint` passes with existing warnings only.
  - `bun run format:check` passes.

## Auth And Session Gate

- Replaced mock localStorage auth with backend cookie session integration.
- Added `src/lib/api/auth.ts` and updated `src/lib/auth.ts` to expose React Query session, login, logout, permission, and display helpers.
- Updated `src/routes/login.tsx` to call `POST /api/auth/login` with tenant slug, email, and password.
- Updated protected route guard to resolve `GET /api/auth/me` and redirect unauthenticated users to `/login`.
- Updated `TopBar` logout to call `POST /api/auth/logout`.
- Updated navigation visibility from backend `permissionKeys`; frontend hiding is UX-only and backend remains authoritative.
- Verified live backend auth smoke on `API_PORT=3004`:
  - `POST /api/auth/login` as `UAT_ADMIN_EMAIL` passed and set `custivio_session`.
  - `GET /api/auth/me` with the session passed.
  - `POST /api/auth/logout` passed.
  - `GET /api/auth/me` after logout returned expected `401`.
- Re-ran frontend gates after auth:
  - `bun run test` passes.
  - `bun run typecheck` passes.
  - `bun run lint` passes with existing Fast Refresh warnings only.
  - `bun run build` passes with a non-fatal Wrangler log permission warning.

## Next Incomplete Task

No incomplete API integration task remains. Mock-data quarantine remains intentionally deferred until product QA signoff.

## Business Module Integration Pass

- Added typed service wrappers for admin/RBAC, catalog, locations, assets/attachments, stock, custody/transfers, maintenance/warranty, audit/import/export/reporting, and status APIs.
- Replaced visible route mock data with React Query calls to the Fastify backend.
- Wired admin users, roles, assignments, catalog records, location hierarchy, asset list/detail/create, attachment upload/download/delete, stock unit/item/movement, custody checkout/check-in/handover, transfer request/decision, maintenance ticket/status, warranty creation, audit campaign/scan, import preview/process, export create/download, saved filters, dashboard summaries, and system status.
- Fixed protected route behavior for TanStack SSR by making server-side `beforeLoad` non-blocking and enforcing browser session checks in the authenticated shell.
- Confirmed browser integration with the Fastify API on `http://127.0.0.1:3004` and frontend on `http://127.0.0.1:5177`.
- CORS requirement found during browser smoke: backend must include the frontend dev origin, for example `CORS_ALLOWED_ORIGINS=http://127.0.0.1:5177,http://localhost:5177`.

## Latest Quality Gates

- `bun run typecheck`: passed.
- `bun run test`: passed, 3 files and 20 tests.
- `bun run lint`: passed with the existing 6 Fast Refresh warnings in UI primitive files.
- `bun run format:check`: passed.
- `bun run build`: passed; Wrangler still emits a non-fatal EPERM warning while trying to write debug logs under `~/Library/Preferences/.wrangler/logs`.
- Browser route smoke after API integration: passed for `/`, `/assets`, `/catalog`, `/stock`, `/custody`, `/maintenance`, `/audit-reports`, `/status`, `/users`, `/roles`, and `/assignments`.
- Lower-permission UAT smoke: `UAT_STORE_EMAIL` logs in successfully and admin user APIs return expected `403` permission denial.

## Completion Pass

- Added global mutation success/error toasts through `src/lib/query-client.ts` and `sonner`.
- Added advanced admin forms for user update, password reset, role update, user disable, role assignment and assignment removal.
- Added catalog and location update controls against the backend PATCH APIs.
- Added asset edit and lifecycle-event forms to the asset detail page.
- Added repeatable full-system smoke coverage in `scripts/e2e-smoke.mjs`.
- Proved a backend contract mismatch for documented browser FormData uploads: `POST /api/assets/:id/attachments` was rejecting valid multipart requests with `400 body must be object` before auth/file handling.
- Fixed the backend multipart upload route narrowly in `../custivio/apps/api/src/routes/assets.routes.ts` and added regression coverage in `../custivio/apps/api/src/tests/storage-routes.test.ts`.
- Final E2E smoke passed against the real Fastify API on `http://127.0.0.1:3004` and frontend on `http://127.0.0.1:5177`:
  - frontend routes respond
  - backend login/session restore/logout
  - catalog and locations
  - asset list/search/detail/create
  - asset lifecycle and attachment upload/download/delete
  - stock movement
  - custody and transfers
  - maintenance and warranty
  - audit/import/export/reports
  - ops/health/metrics/OpenAPI
  - 401 behavior after logout

## Final Quality Gates

- Backend `pnpm build:api`: passed.
- Backend `pnpm test:api`: passed, 9 files and 25 tests.
- Backend `pnpm check`: passed.
- Backend `RUN_DB_TESTS=1 pnpm test`: passed after local network escalation, 24 files and 81 tests.
- Frontend `bun run format:check`: passed.
- Frontend `bun run typecheck`: passed.
- Frontend `bun run test`: passed, 3 files and 20 tests.
- Frontend `bun run lint`: passed with 6 existing Fast Refresh warnings in UI primitive files.
- Frontend `bun run build`: passed with the existing non-fatal Wrangler log EPERM warning.
- Frontend `bun run test:e2e`: passed.
