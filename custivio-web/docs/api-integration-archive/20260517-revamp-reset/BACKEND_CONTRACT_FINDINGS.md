# Backend Contract Findings

## Confirmed Ready

- Backend readiness audit reports 98% readiness with zero critical blockers.
- Fastify API base URL defaults to `http://localhost:3000`.
- UAT users exist under tenant slug `default`.
- Browser auth uses HTTP-only cookie `custivio_session`; frontend must use `credentials: "include"`.
- OpenAPI is available at `/api/openapi.json`; Swagger UI is available at `/api/docs`.
- Backend modules are available for auth, admin/RBAC, catalog, locations, assets, attachments, stock, custody, transfers, maintenance, audits, imports, reports, workers/jobs, health, ops, and metrics.

## Important Contract Rules

- No generic `/api/files/{objectId}/download`; use asset attachment and report export download endpoints.
- Frontend must resolve UUIDs from list endpoints; do not hardcode seed UUIDs.
- Retry-sensitive mutations need unique `idempotencyKey`.
- Idempotency replay applies to stock movements, import job creation, and export job creation.
- Reusing an idempotency key with a different payload returns `409 idempotency_conflict`.
- Attachment downloads and report downloads are authorized streaming API responses; never call MinIO from the browser.

## Initial Frontend Mismatches

- Mock tenant code is `ACME`; backend UAT tenant slug is `default`.
- Mock permission keys use names like `asset.read`; backend uses keys like `assets.read`.
- Mock auth uses `localStorage`; backend uses cookie session.
- Mock IDs are fixture IDs like `ast_0001`; backend uses UUIDs.
- Mock dashboards include hardcoded metrics that need to become derived from real APIs.

## Integration Findings

- Browser CORS requires the frontend dev origin in backend env, for example `CORS_ALLOWED_ORIGINS=http://127.0.0.1:5177,http://localhost:5177`.
- TanStack Start SSR cannot validate the browser-only `custivio_session` cookie for this separate frontend origin during route `beforeLoad`; protected routes now render a loading/auth check in the browser and redirect unauthenticated users after `GET /api/auth/me`.
- Backend returns expected browser-visible network errors for `401` and `403`; the API client parses the typed error envelope and route panels show permission-denied/error states without crashing.
- The active frontend must use the documented asset attachment and report export download APIs. No generic file download endpoint exists.
- Browser FormData upload initially exposed a backend mismatch: `POST /api/assets/:id/attachments` returned `400 body must be object` before `request.file()` ran. The backend was fixed narrowly in `../custivio/apps/api/src/routes/assets.routes.ts`, regression-tested in `../custivio/apps/api/src/tests/storage-routes.test.ts`, and the frontend E2E upload/download flow now passes.
- Advanced CRUD update forms are now visible for the required integration scope: user update/reset, role update, catalog/location update, asset update, lifecycle event, status, decision and archive controls are wired to the documented APIs.
