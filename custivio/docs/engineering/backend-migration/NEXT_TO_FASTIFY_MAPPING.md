# Next.js To Fastify Mapping

This mapping defines how current Next.js backend concepts should be replaced in a later Fastify implementation.

## Framework Concept Mapping

| Next.js concept                                | Fastify replacement                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `app/api/**/route.ts`                          | `apps/api/src/routes/*.routes.ts`                                                     |
| `export async function GET/POST/PATCH/DELETE`  | `fastify.get/post/patch/delete(path, options, handler)`                               |
| `NextRequest`                                  | `FastifyRequest` with typed params, query, body, cookies                              |
| `NextResponse`                                 | `FastifyReply`                                                                        |
| `NextResponse.json(body, { status, headers })` | `reply.status(status).headers(headers).send(body)`                                    |
| `new Response(text, { headers })`              | `reply.type(contentType).send(text)`                                                  |
| `request.cookies.get(name)?.value`             | `request.cookies[name]` through `@fastify/cookie`                                     |
| `response.cookies.set(...)`                    | `reply.setCookie(...)` through `@fastify/cookie`                                      |
| `request.nextUrl.searchParams`                 | Fastify typed query object or `new URL(request.url, base)`                            |
| `context.params`                               | Fastify route params                                                                  |
| `request.json()`                               | Fastify parsed JSON body                                                              |
| `request.formData()`                           | `@fastify/multipart` file/field parsing                                               |
| `File.arrayBuffer()`                           | Multipart stream buffering with configured size limits, or stream directly to MinIO   |
| `next/headers` `cookies()`                     | Fastify auth/cookie helper                                                            |
| `next/navigation` `redirect()`                 | Frontend redirect responsibility, except explicit auth form redirects returned by API |
| `middleware.ts` page protection                | Fastify route pre-handlers for API auth; external frontend handles page protection    |
| `next.config.mjs` security headers             | Fastify security plugin or response hook                                              |
| Next build/server                              | Node/Fastify build/start                                                              |
| `apps/web/lib/api/responses.ts`                | `apps/api/src/http/responses.ts`                                                      |
| `/api/metrics` Next route                      | Fastify metrics route                                                                 |
| `/api/health/*` Next routes                    | Fastify health routes                                                                 |

## Request Context Mapping

Current route handlers manually create `requestId` using `createRequestId(request.headers.get("x-request-id"))`. In Fastify:

1. `request-id.plugin.ts` reads `x-request-id`.
2. If absent, it calls `createRequestId`.
3. It decorates the request, for example `request.requestId`.
4. It adds `x-request-id` to every response.
5. Error handling uses the same request ID in the error body.

Current session token extraction repeats `request.cookies.get(SESSION_COOKIE_NAME)?.value`. In Fastify:

1. `@fastify/cookie` parses cookies.
2. `auth.plugin.ts` exposes `getSessionToken(request)`.
3. Route handlers pass the token to existing `packages/auth` or `packages/core` services.
4. Services remain the source of permission and tenant checks.

## Response Mapping

Current handled API errors:

```json
{
  "error": {
    "code": "forbidden",
    "message": "Permission denied.",
    "requestId": "req_..."
  }
}
```

Fastify must keep this exact shape. `apps/api/src/http/responses.ts` should map:

- `isAuthError`
- `isCatalogError`
- `isAssetError`
- `isStockError`
- `isOperationsError`
- `isReportingError`
- unhandled errors to `internal_error` with status `500`

## Multipart Mapping

Current attachment upload evidence:

- `apps/web/app/api/assets/[id]/attachments/route.ts` checks only that `file instanceof File`.
- It buffers the full upload with `new Uint8Array(await file.arrayBuffer())`.
- It calls `uploadAssetAttachmentForSession` in `packages/core/src/assets/asset-service.ts`.

Fastify target:

- Register `@fastify/multipart` with explicit `fileSize` and file count limits.
- Validate that field name is `file`.
- Validate MIME and filename policy before storage.
- Preserve success shape `201 { attachment }`.
- Preserve error shape and `x-request-id`.
- Prefer bounded buffer or stream-to-MinIO helper depending on storage package changes.

## Auth Route Mapping

Current login behavior from `apps/web/app/api/auth/login/route.ts`:

- Accepts JSON or form fields.
- Applies `checkLoginRateLimit`.
- Calls `authenticateWithPassword`.
- Sets `custivio_session` cookie.
- Returns JSON `{ session }` when the client accepts JSON.
- Redirects to `/dashboard` for non-JSON form login success.
- Redirects to `/login?error=...` for non-JSON auth failures.

Fastify must preserve these behaviors during parity. Any later frontend-only change must be documented as a breaking change or API version change.

## Security Header Mapping

Current security headers are configured in `apps/web/next.config.mjs`:

- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`
- `Permissions-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`

Fastify target:

- Apply equivalent headers through `@fastify/helmet` or explicit hooks.
- Tighten CSP separately after API-only deployment is validated.
- Do not regress `X-Content-Type-Options` or `X-Frame-Options`.

## Script Mapping

| Current script    | Current behavior              | Fastify target                                                |
| ----------------- | ----------------------------- | ------------------------------------------------------------- |
| `pnpm dev`        | Runs `@custivio/web` Next dev | Run `@custivio/api` dev server after migration                |
| `pnpm build`      | Runs `@custivio/web build`    | Build `apps/api` TypeScript output                            |
| `pnpm typecheck`  | `pnpm -r typecheck`           | Continue across all packages and `apps/api`                   |
| `pnpm test`       | `vitest run`                  | Continue; add Fastify route contract tests                    |
| `pnpm docker:dev` | Starts dev dependencies only  | Keep dev dependency Compose; optionally add API service later |

## Test Mapping

| Existing test type                                            | Fastify equivalent                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| Package integration tests under `tests/integration/*.test.ts` | Keep and run unchanged                                      |
| Manual route curls from readiness audit                       | Replace with automated Fastify inject tests and smoke curls |
| Next route behavior                                           | Add `apps/api/src/tests/route-contract/*.test.ts`           |
| Auth/session tests                                            | Add Fastify cookie and JSON/form tests                      |
| Health/metrics tests                                          | Use Fastify inject and live server smoke checks             |
