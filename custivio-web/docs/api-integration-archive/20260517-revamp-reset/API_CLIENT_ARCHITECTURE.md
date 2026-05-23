# API Client Architecture

## Target Structure

The frontend will use one central API integration layer under `src/lib/api/`:

```text
src/lib/api/
  config.ts
  client.ts
  errors.ts
  types.ts
  endpoint.ts
  pagination.ts
  upload.ts
  idempotency.ts
  query-string.ts
  generated/
    openapi.ts
```

Feature-specific API modules may live next to the shared client as small typed wrappers, for example `src/lib/api/assets.ts`, `stock.ts`, and `auth.ts`.

## Environment

Use `VITE_API_BASE_URL` because this is a Vite/TanStack app. Local default is `http://localhost:3000`. When backend port `3000` is busy, use:

```bash
VITE_API_BASE_URL=http://localhost:3002
```

## Request Behavior

- Always set `credentials: "include"`.
- JSON requests set `Accept: application/json` and `Content-Type: application/json`.
- `FormData` requests do not set `Content-Type`.
- Parse the backend error envelope into `ApiResult`.
- Capture `x-request-id`.
- Capture `retry-after` for `429`.
- Support `blob` downloads for asset attachments and report exports.
- Support query params, path params, abort signals, and idempotency keys.

## Result Shape

```ts
type ApiResult<T> =
  | { ok: true; data: T; requestId?: string }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      requestId?: string;
      retryAfterSeconds?: number;
      raw?: unknown;
    };
```

## OpenAPI Types

Preferred: generate type references from `GET /api/openapi.json` when the backend is running. If code generation is added, it must be a free/open-source dev dependency and documented for air-gapped lockfile use.

Initial implementation may use hand-written contract types sourced from `../custivio/docs/engineering/API_CONTRACT.md` and later replace or augment them with generated OpenAPI types.

## Test Requirements

- Success JSON.
- 400, 401, 403, 409, 429, and 500 error parsing.
- Request ID capture.
- Retry-after capture.
- Query params and path params.
- FormData upload behavior.
- Blob download behavior.
- Abort/timeout behavior if implemented.
