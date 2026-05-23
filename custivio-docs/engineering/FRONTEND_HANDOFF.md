# Frontend Handoff

This handoff is for teams consuming the Fastify API in `apps/api`. Frontend visual design and screen completeness are outside this document.

## Runtime

- Local Fastify API: `http://localhost:3000` unless `API_PORT` is overridden.
- If another local service is already using port `3000`, run with an override such as
  `API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start`.
- Development CORS allows common local frontend origins by default, including `http://localhost:8080`, `http://localhost:8081`, `http://localhost:5173`, and `http://localhost:5177`.
- If your frontend runs on a different origin, include it in `CORS_ALLOWED_ORIGINS` when starting the API, for example
  `CORS_ALLOWED_ORIGINS=http://localhost:8080 API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start`.
- OpenAPI JSON: `GET /api/openapi.json`
- Swagger UI: `GET /api/docs`
- This backend repo no longer contains an active Next.js runtime. Frontend UI work should consume the Fastify API from a separate frontend project.
- OpenAPI is suitable for frontend typed-client scaffolding: route tags, path/query params, request bodies, success responses, standard error responses, and component schemas are covered by `apps/api/src/tests/openapi-schema.test.ts`.

## Auth

- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- Current session: `GET /api/auth/me`
- Cookie: `custivio_session`, HTTP-only, SameSite Lax, secure when configured.
- Browser clients must use `credentials: "include"`.
- Frontend should use returned `permissionKeys` for navigation visibility only; backend permission checks remain authoritative.

## Local UAT Seed Data

Run local/dev seed data with:

```bash
pnpm db:seed
pnpm db:seed:uat
```

The UAT seed is local-only and must not be treated as production bootstrap credentials.
Emails and password are read from backend env keys in `.env`.

| Role          | Email               | Password            | Primary use                                    |
| ------------- | ------------------- | ------------------- | ---------------------------------------------- |
| Administrator | `UAT_ADMIN_EMAIL`   | `UAT_SEED_PASSWORD` | Admin users, roles, assignments, all modules   |
| Asset manager | `UAT_MANAGER_EMAIL` | `UAT_SEED_PASSWORD` | Catalog, assets, custody, maintenance, reports |
| Store user    | `UAT_STORE_EMAIL`   | `UAT_SEED_PASSWORD` | Stock, receiving, issue, import/export support |
| Auditor       | `UAT_AUDITOR_EMAIL` | `UAT_SEED_PASSWORD` | Audit campaigns, scans, reports                |

Seeded records include organization `ITOPS`, departments `IT-INFRA` and `IT-STORE`, location hierarchy `HQ / HQ-A / 01 / IT-STOR / RACK-A1 / SHELF-A / BIN-SPARES-A`, assets `UAT-LAP-001`, `UAT-SRV-001`, `UAT-NET-001`, stock SKUs `UAT-CABLE-CAT6-1M`, `UAT-CONS-THERMAL-PASTE`, and `UAT-CHIP-TPM-2`.

## Response And Error Contract

Successful JSON responses preserve the existing shapes documented in `docs/engineering/API_CONTRACT.md`.

Handled errors use:

```json
{
  "error": {
    "code": "forbidden",
    "message": "Permission denied.",
    "requestId": "..."
  }
}
```

All responses include `x-request-id` when the Fastify request pipeline handles the route.

## Uploads And Downloads

- Asset upload: `POST /api/assets/{id}/attachments` with multipart field `file`.
- Asset download: `GET /api/assets/{id}/attachments/{attachmentId}/download`.
- Asset soft-delete: `DELETE /api/assets/{id}/attachments/{attachmentId}`.
- Export download: `GET /api/reports/exports/{exportId}/download`.
- Upload MIME and size policy is centralized in `packages/storage/src/policies.ts`.
- Downloads are authorized streaming responses through Fastify. The frontend must not call MinIO directly.
- Download responses include sanitized `content-disposition`, `content-type`, `content-length`, and `x-request-id` headers.
- New attachment/export metadata includes `contentLength` and `checksumSha256`; the backend validates checksum on download.

## Idempotency And Rate Limits

- Generate an `idempotencyKey` for stock movements, import job creation, and export job creation.
- Same key plus same payload replays the existing result; same key plus changed payload returns `409 idempotency_conflict`.
- Sensitive mutation rate limits return `429 rate_limited` with a `retry-after` header. This applies to login, admin mutations, attachment upload, import job creation, and export job creation.
- On `409 idempotency_conflict`, show a retry-safe conflict message and ask the user to resubmit with a new operation key after reviewing the form.

## Backend Areas Available

- Health, readiness, metrics, operations status.
- Auth/session.
- Admin users, roles, and role assignments.
- Catalog CRUD/archive.
- Location CRUD/archive.
- Asset registry, lifecycle, and attachment file flows.
- Stock items, units, and movements with idempotency replay.
- Custody, handovers, transfers.
- Maintenance tickets/status and warranties.
- Audit campaigns/scans, import jobs/process, report exports/filters.
- Worker-backed import/export job processing with retry, dead-letter, and status visibility through the existing import/export list APIs.
- UAT/dev seed data for frontend integration across auth, catalog, locations, assets, stock, custody/transfers, maintenance, audits, imports, and exports.

## Worker-Backed Jobs

- Worker command for local/backend smoke testing: `pnpm worker -- --once --queue imports` or `pnpm worker -- --once --queue exports`.
- Import process jobs use queue `imports`, type `import.process`, and payload `{ tenantId, importJobId }`.
- Export verification jobs use queue `exports`, type `export.verify`, and payload `{ tenantId, exportJobId }`.
- The frontend should poll `GET /api/imports/jobs` and `GET /api/reports/exports` for job state. Do not call Valkey or worker internals directly.
- Failed worker attempts update import job metadata with retry/error details; exhausted jobs are moved to Valkey dead-letter queues and surfaced as `dead_letter` where database state is available.

## Known Backend Gaps

- Generic `/api/files/{objectId}/download` is not implemented because there is no generic file abstraction yet.
- Fastify route tests verify registration, auth/error shape, OpenAPI exposure, storage downloads, rate-limit behavior, and selected route behavior. DB-backed success-path coverage is in the broader integration suite.
- The seeded export job is metadata-only and marked `pending`; create a fresh export through `POST /api/reports/exports` when testing downloadable export objects.
