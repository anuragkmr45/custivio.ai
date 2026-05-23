# API Client Architecture After Revamp

Report date: 2026-05-17

## Location

```text
src/lib/api/
  admin.ts
  assets.ts
  auth.ts
  catalog.ts
  client.ts
  config.ts
  custody.ts
  endpoint.ts
  errors.ts
  generated/openapi.ts
  idempotency.ts
  index.ts
  locations.ts
  maintenance.ts
  query-string.ts
  records.ts
  reporting.ts
  status.ts
  stock.ts
  types.ts
  upload.ts
```

## Base URL

`src/lib/api/config.ts` reads the frontend runtime env and falls back to local backend defaults. Local verified setting:

```text
VITE_API_BASE_URL=http://localhost:3002
```

The source does not hardcode a production API URL.

## Request Contract

`src/lib/api/types.ts` defines the central `ApiResult<T>` and `ApiRequestOptions` contract.

`src/lib/api/client.ts` handles:

- `credentials: "include"` on every browser request.
- `Accept: application/json` for JSON calls.
- `Content-Type: application/json` only for JSON bodies.
- No manual `Content-Type` for `FormData` upload through `upload.ts`.
- Path parameter interpolation through `endpoint.ts`.
- Query string serialization through `query-string.ts`.
- Blob downloads through `expect: "blob"`.
- Request ID capture through `x-request-id`.
- Retry-after capture in API errors.
- 401, 403, 409, 429, and 500 error parsing into `ApiResult`.
- Idempotency key header forwarding for retry-sensitive mutations.
- Abort signal support through the shared request options.

## Service Layer

UI routes call typed services instead of calling `fetch` directly from components:

- `auth.ts`: login/logout/current session.
- `admin.ts`: users, roles, assignments.
- `catalog.ts`: catalog resource CRUD.
- `locations.ts`: location hierarchy CRUD.
- `assets.ts`: asset registry, detail, lifecycle, attachments.
- `stock.ts`: units, items, overview, movements.
- `custody.ts`: checkouts, checkins, handovers, transfers.
- `maintenance.ts`: tickets, status changes, warranties.
- `reporting.ts`: audits, imports, exports, filters, downloads.
- `status.ts`: health, readiness, ops, metrics, OpenAPI.

## OpenAPI Types

`src/lib/api/generated/openapi.ts` exists as a generated/derived typing target. The backend OpenAPI endpoint is `GET /api/openapi.json`; the e2e smoke confirmed 44 paths. Regenerate after backend contract changes by running the backend on a local port, fetching `/api/openapi.json`, and updating the generated file through the selected open-source generator workflow.

No paid SaaS or cloud-only dependency is required.

## Tests

`src/lib/api/client.test.ts` covers:

- JSON success.
- Error response parsing.
- 401/403/conflict/rate-limit/server errors through shared error handling.
- Request ID capture.
- Path params.
- Query params.
- FormData upload header behavior.
- Blob download.
- Idempotency key headers.

`src/lib/api/services.test.ts` covers endpoint mapping for business service modules.

## Result

API client architecture status: COMPLETE.
