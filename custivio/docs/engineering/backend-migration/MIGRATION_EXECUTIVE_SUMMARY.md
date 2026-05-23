# Fastify Migration Executive Summary

## Decision

The current code can be safely migrated to Fastify **if the migration is done as an API parity project first** and Next.js is kept until tests prove behavior parity.

The existing architecture is favorable because most business behavior already lives in framework-independent packages:

- `packages/db`
- `packages/core`
- `packages/auth`
- `packages/storage`
- `packages/cache`
- `packages/config`
- `packages/telemetry`

Current scope to port:

- 33 Next.js API route files.
- 46 HTTP method endpoints.
- Existing API prefix `/api`.
- Existing cookie name `custivio_session`.
- Existing error shape and request ID behavior.

## 1. Can The Current Code Be Safely Migrated To Fastify?

Yes, with controlled phases.

Why it is safe:

- Route handlers are generally thin and call package services.
- Drizzle/PostgreSQL code is isolated in `packages/db`.
- Business workflows are mostly in `packages/core`.
- Session and permission logic is in `packages/auth`.
- Storage, cache, config, and telemetry already have package boundaries.

Why it is not a blind replacement:

- Next-specific request/response/cookie/multipart APIs must be rewritten.
- Login/logout redirect behavior must be preserved for non-JSON clients.
- Upload handling must move from `File.arrayBuffer()` to bounded Fastify multipart handling.
- Security headers in `apps/web/next.config.mjs` must move to Fastify.
- Route-contract tests are currently missing and must be added before deleting Next.js.

## 2. What Should Be Kept?

Keep:

- `packages/db`
- `packages/core`
- `packages/auth`
- `packages/storage`
- `packages/cache`
- `packages/config`
- `packages/telemetry`
- `infra/docker-compose.dev.yml`
- `infra/prometheus/**`
- `infra/grafana/**`
- `infra/otel/**`
- `infra/minio/init-bucket.sh`
- `tests/integration/*.test.ts`
- `docs/engineering/**`
- `docs/operations/**`

## 3. What Should Be Moved?

Move by rewriting/adapting, not copying blindly:

- `apps/web/lib/api/responses.ts` to `apps/api/src/http/responses.ts`.
- Repeated JSON-body parsing into `apps/api/src/http/validation.ts`.
- Repeated cookie extraction into `apps/api/src/http/cookies.ts` or `auth.plugin.ts`.
- Current route behavior from `apps/web/app/api/**` into `apps/api/src/routes/*.routes.ts`.
- Security headers from `apps/web/next.config.mjs` into Fastify security plugin/hook.

## 4. What Should Be Deleted?

Delete later only after parity gates pass:

- `apps/web/app/api/**`
- `apps/web/lib/api/responses.ts`
- `apps/web/lib/auth/session.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.mjs`
- `apps/web` UI/page files if the frontend moves out of this repo
- Next, React, Tailwind, Radix, and UI-only dependencies
- Next-specific root scripts
- Next-specific ESLint allowances

## 5. What Must Be Rewritten?

Must rewrite:

- `NextRequest` handlers as Fastify handlers.
- `NextResponse` JSON/text responses as `FastifyReply` responses.
- `request.cookies.get` and `response.cookies.set` through `@fastify/cookie`.
- `request.formData()` upload route through `@fastify/multipart`.
- `request.nextUrl` query and redirect handling.
- Next middleware page redirects as frontend concern or Fastify route hooks.
- Next security headers as Fastify security headers.

## 6. High-Risk Areas

1. **Auth cookies and redirects**
   - Evidence: `apps/web/app/api/auth/login/route.ts` returns JSON for JSON clients and redirects for form clients while setting `custivio_session`.
   - Risk: small cookie/redirect differences can break browser auth.

2. **Multipart uploads**
   - Evidence: `apps/web/app/api/assets/[id]/attachments/route.ts` uses `request.formData()` and `File.arrayBuffer()`.
   - Risk: Fastify multipart behavior differs and must enforce limits.

3. **Error response parity**
   - Evidence: `apps/web/lib/api/responses.ts` maps multiple domain errors.
   - Risk: frontend expects stable `error.code`, `error.message`, and `error.requestId`.

4. **Reporting overview permissions**
   - Evidence: `packages/core/src/reporting/reporting-service.ts` requires `audits.read`, `imports.read`, and `reports.read` together for overview reads.
   - Risk: preserving this is necessary for parity, but it remains a least-privilege product gap.

5. **Storage and job blockers**
   - Evidence: readiness audit identifies missing download/delete and missing Valkey locks/jobs.
   - Risk: a backend-only repo should fix these before claiming production readiness.

6. **Production packaging**
   - Evidence: only `infra/docker-compose.dev.yml` exists today.
   - Risk: Fastify migration must include production Docker packaging before on-prem release.

## 7. Exact Implementation Phases

1. Create `apps/api` Fastify foundation.
2. Add request ID, error, config, logger, cookie, metrics, and Swagger plugins.
3. Port health, readiness, metrics, and ops routes.
4. Port auth routes with exact cookie/form/JSON parity.
5. Port admin list, catalog, asset, stock, custody, transfer, maintenance, audit, import, and report routes.
6. Add route-contract tests for all 46 method endpoints.
7. Fix backend readiness blockers:
   - file download/delete
   - Valkey locks/idempotency/queues/jobs
   - admin/user/RBAC mutation APIs
   - location management API
   - production deployment packaging
8. Generate and validate OpenAPI docs.
9. Switch root scripts to `apps/api`.
10. Remove Next.js only after parity and frontend decoupling are approved.

## 8. Exact Verification Commands

Baseline after planning docs:

```bash
pnpm format:check
pnpm check:forbidden
```

During Fastify implementation:

```bash
pnpm install
pnpm check:forbidden
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

When DB or seed changes:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:seed
RUN_DB_TESTS=1 pnpm test
```

When infrastructure changes:

```bash
pnpm docker:dev
docker compose -f infra/docker-compose.dev.yml ps
```

When Fastify server exists:

```bash
pnpm --filter @custivio/api build
pnpm --filter @custivio/api test
curl -sS http://127.0.0.1:3000/api/health/live
curl -sS http://127.0.0.1:3000/api/health/ready
curl -sS http://127.0.0.1:3000/api/metrics
```

## 9. Estimated Readiness After Migration

Estimated backend/db/infra readiness:

- After route parity only: **70-75%**
- After route parity plus the five blocker fixes: **90-95%**
- After production packaging, OpenAPI docs, route-contract tests, and restore rehearsal: **95%+**

Remaining risk after migration should mainly be operational hardening, load testing, and final frontend integration, not missing backend foundations.

## Next Prompt To Begin Implementation

```text
Implement Phase 1 of the Fastify migration plan in docs/engineering/backend-migration/.

Scope:
- Do not delete Next.js.
- Create apps/api with a Fastify app factory and server entry.
- Add config, logger, request-id, error, metrics, cookie, and Swagger plugin scaffolding.
- Port only /api/health/live, /api/health/ready, /api/metrics, and /api/ops/status.
- Preserve existing response shapes, status codes, content types, and x-request-id behavior.
- Add route-contract tests for those public routes.
- Update root/package scripts only as needed to build and test apps/api without breaking apps/web.
- Do not add feature APIs yet.

Run:
pnpm install
pnpm check:forbidden
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build

Report files changed, commands run, pass/fail results, and remaining migration risks.
```
