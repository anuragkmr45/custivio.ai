# Next.js Removal Plan

Do not remove Next.js until Fastify parity is implemented, tested, and accepted. This file defines the future removal sequence only.

## Removal Gates

Next.js can be removed only when all gates pass:

1. `apps/api` exists and builds.
2. All 46 current HTTP method endpoints are implemented in Fastify.
3. Route-contract tests cover every existing API path and method.
4. Auth/session cookie tests pass for login, logout, `me`, invalid login, inactive user, and rate limiting.
5. Health, readiness, metrics, and ops status work against a running Fastify server.
6. OpenAPI generation includes every stable backend route.
7. Existing package tests pass.
8. `pnpm check:forbidden` passes.
9. External frontend team confirms they no longer depend on Next.js pages or route handlers from this repo.
10. A rollback point exists, such as a commit/tag before deletion.

## Files And Folders To Remove Later

| Path                                                           | Remove when                                   | Notes                                                          |
| -------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `apps/web/app/api/**`                                          | Fastify route parity tests pass               | Do not delete before parity.                                   |
| `apps/web/lib/api/responses.ts`                                | Fastify `http/responses.ts` replaces it       | Preserve error mappings first.                                 |
| `apps/web/lib/auth/session.ts`                                 | Backend no longer renders/protects Next pages | Fastify auth plugin replaces API session extraction.           |
| `apps/web/middleware.ts`                                       | Frontend moves out or Next pages are removed  | Page redirects become external frontend concern.               |
| `apps/web/next.config.mjs`                                     | No Next build remains                         | Security headers must exist in Fastify first.                  |
| `apps/web/app/**` page/layout files                            | External frontend owns UI                     | Frontend visual work is out of backend repo scope.             |
| `apps/web/components/**`, `apps/web/features/**`               | External frontend owns UI                     | Confirm no backend tests import these folders.                 |
| `apps/web/tailwind.config.ts`, `postcss.config.mjs`, UI styles | UI removed                                    | Keep docs only if still useful as reference, otherwise delete. |
| `apps/web/package.json`                                        | Root scripts no longer reference it           | Replace with `apps/api/package.json`.                          |

## Dependencies To Remove Later

Remove from `apps/web/package.json` or root manifests only after `apps/web` is removed:

- `next`
- `react`
- `react-dom`
- `@types/react`
- `@types/react-dom`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- UI-only shadcn/Radix dependencies if added later

Keep:

- TypeScript
- Vitest
- ESLint
- Prettier
- Drizzle
- PostgreSQL client
- Valkey client
- AWS S3 client for MinIO
- OpenTelemetry/Prometheus dependencies
- Zod

## Scripts To Change Later

| Script       | Current behavior                    | Later behavior                                                  |
| ------------ | ----------------------------------- | --------------------------------------------------------------- |
| `dev`        | `pnpm --filter @custivio/web dev`   | `pnpm --filter @custivio/api dev`                               |
| `build`      | `pnpm --filter @custivio/web build` | `pnpm --filter @custivio/api build`                             |
| `typecheck`  | workspace typecheck                 | Keep, now including `apps/api` and excluding removed `apps/web` |
| `test`       | `vitest run`                        | Keep; include Fastify route tests                               |
| `docker:dev` | dependency stack only               | Keep; optionally add an API service compose override            |

## ESLint And Boundary Changes Later

Update `eslint.config.mjs` after `apps/api` exists:

- Replace `apps/web` route-handler allowances with `apps/api` route-handler boundaries.
- Keep forbidden dependency rules.
- Keep `process.env` restriction outside `packages/config`.
- Allow Fastify imports only in `apps/api`, not in core packages.
- Continue blocking DB/storage/cache direct imports from UI folders if any frontend code remains.
- Keep no-floating-promises and no-explicit-any enforcement.

## Env Changes Later

Remove or rename Next-specific env and config after deletion:

- `APP_BASE_URL` default may become `API_BASE_URL` or remain as service public base URL.
- Add `API_HOST`, `API_PORT`, and trusted proxy settings if needed.
- Add CORS allowed origins only if external frontend uses a different origin.
- Add cookie secure/domain settings for production.

Do not commit production secrets. Keep `.env.example` placeholder-only.

## Rollback Plan

Before removal:

1. Tag or commit the last working Next.js parity state.
2. Confirm `pnpm check`, Fastify route-contract tests, and Docker checks pass.
3. Remove Next files in a dedicated commit.
4. If an issue is found, revert only the removal commit and keep Fastify code intact.

## Manual QA Before Deletion

- Login with JSON client and browser form flow.
- Logout with JSON client and browser form flow.
- Call all protected routes with valid session.
- Call representative protected routes with missing session and wrong permission.
- Upload an attachment.
- Download/delete attachment after blocker implementation.
- Confirm `/api/metrics` is scraped by Prometheus.
- Confirm `/api/health/ready` returns 503 when PostgreSQL, Valkey, or MinIO is stopped.
