# Backend Contract Findings After Revamp

Report date: 2026-05-17

## Backend Readiness

The backend audit reports:

```text
Backend/DB/Infra readiness: 98%
Verdict: READY TO SHIP EXCEPT FRONTEND
Frontend can start: fully
Critical blockers: 0
High-priority gaps: 0
```

## Contract Sources Read

- `custivio/docs/engineering/API_CONTRACT.md`
- `custivio/docs/engineering/FRONTEND_HANDOFF.md`
- `custivio/docs/engineering/FRONTEND_API_EXAMPLES.md`
- `custivio/docs/engineering/FRONTEND_TEST_DATA.md`
- `custivio/docs/engineering/api-smoke.http`
- `custivio/docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT_AFTER_COMPLETION.md`
- `custivio/apps/api/src/routes/**`
- `custivio/apps/api/src/openapi/schemas.ts`

## API Inventory

OpenAPI smoke inspection reports 44 paths. Active route files include:

- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Admin: `/api/admin/users`, `/api/admin/roles`, `/api/admin/assignments`
- Catalog: `/api/catalog/:resource`
- Locations: `/api/locations/:resource`
- Assets and attachments: `/api/assets`, `/api/assets/:id`, attachment upload/download/delete, lifecycle
- Stock: `/api/stock/items`, `/api/stock/units`, `/api/stock/movements`
- Custody: `/api/custody/checkouts`, `/api/custody/checkins`, `/api/custody/handovers`
- Transfers: `/api/transfers`, `/api/transfers/:id/decision`
- Maintenance: `/api/maintenance/tickets`, ticket status, warranties
- Audits: `/api/audits/campaigns`, `/api/audits/scans`
- Imports: `/api/imports/jobs`, `/api/imports/jobs/:id/process`
- Reports: `/api/reports/exports`, export download, saved filters
- Ops: `/api/health/live`, `/api/health/ready`, `/api/ops/status`, `/api/metrics`, `/api/openapi.json`, `/api/docs`

## Frontend Requirements Confirmed

- Browser requests must use `credentials: "include"`.
- JSON requests must send `Accept: application/json`.
- JSON bodies must send `Content-Type: application/json`.
- Multipart attachment upload uses field `file`.
- Attachment downloads must use `/api/assets/{id}/attachments/{attachmentId}/download`.
- Export downloads must use `/api/reports/exports/{exportId}/download`.
- Stock/import/export mutations should send idempotency keys.
- Worker state is observed through HTTP job list endpoints only.
- No generic `/api/files/{objectId}/download` endpoint exists.

## Contract Mismatches Found

No business API contract mismatch remains.

One local development infrastructure issue was found earlier: browser requests from Vite origins needed backend CORS allowance. The backend config and docs were updated to include local frontend origins including `http://localhost:8080`, `http://localhost:8081`, and `127.0.0.1` equivalents. This did not change business API behavior.

## Known Backend Limitations Respected

- No generic file download route is used by the frontend.
- The frontend does not call MinIO directly.
- The frontend does not call Valkey or worker internals directly.
- UI workflows do not assume undocumented full state machines.
