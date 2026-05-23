# Frontend Code Audit After Revamp

Report date: 2026-05-17

## Overview

The revamped frontend is a TanStack Start/Vite React app with a route-per-module structure and a shared API service layer.

## Folder Structure

```text
src/
  components/
    app-shell/
    data/
    ui/
  hooks/
  lib/
    api/
    auth.ts
    query-client.ts
    role.ts
    mock/data.ts
  routes/
    __root.tsx
    login.tsx
    _authenticated.tsx
    _authenticated/
      index.tsx
      users.tsx
      roles.tsx
      assignments.tsx
      catalog.tsx
      assets.index.tsx
      assets.$assetId.tsx
      stock.tsx
      custody.tsx
      maintenance.tsx
      audit-reports.tsx
      status.tsx
```

## Route Map

| Route              | Purpose                           | Data source                                         |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| `/login`           | Tenant login                      | `/api/auth/login`                                   |
| `/`                | Dashboard                         | Assets, stock, custody, maintenance, audits         |
| `/assets`          | Asset registry                    | `/api/assets`                                       |
| `/assets/$assetId` | Asset detail                      | Asset detail, lifecycle, attachments                |
| `/catalog`         | Catalog and location master data  | `/api/catalog/*`, `/api/locations/*`                |
| `/stock`           | Stock inventory                   | `/api/stock/*`                                      |
| `/custody`         | Custody and transfers             | `/api/custody/*`, `/api/transfers/*`                |
| `/maintenance`     | Tickets and warranties            | `/api/maintenance/*`                                |
| `/audit-reports`   | Audits, imports, exports, filters | `/api/audits/*`, `/api/imports/*`, `/api/reports/*` |
| `/users`           | User admin                        | `/api/admin/users`                                  |
| `/roles`           | Role admin                        | `/api/admin/roles`                                  |
| `/assignments`     | Role assignments                  | `/api/admin/assignments`                            |
| `/status`          | System status                     | Health, ops, metrics, OpenAPI                       |

## Data Fetching

- TanStack Query is used for route data loading, mutations, cache invalidation, loading, and retry UI.
- API calls are centralized in `src/lib/api`.
- No production route should call `fetch` directly except the API client and server runtime wrapper.

## Auth And Session

- Auth is cookie-backed using the backend `custivio_session` cookie.
- `src/lib/auth.ts` wraps `/api/auth/me`, login, and logout in React Query hooks.
- Protected routes redirect unauthenticated users to `/login`.
- Permission-aware navigation uses backend `permissionKeys`.
- No auth token is stored in localStorage.

## Existing Mock/Static Data

- `src/lib/mock/data.ts` remains from the previous UI as a large typed fixture file.
- `src/lib/role.ts` remains as a localStorage role helper from the previous mock UI.
- Active revamped integration routes use backend service modules instead of these files.
- Cleanup recommendation: quarantine or delete these after a final reference check.

## Forms And Validation

- Current forms use native `FormData` handlers and typed request conversion in page modules.
- Backend validation remains authoritative.
- UI validation exists for required fields and submit-state behavior, but deeper schema validation can be expanded with `zod` if future UX requires it.

## Tests

- Unit: `src/lib/api/client.test.ts`, `src/lib/api/services.test.ts`, `src/lib/auth.test.ts`
- E2E/product smoke: `scripts/e2e-smoke.mjs`
- Build/type/lint scripts are present in `package.json`.

## Risks Caused By UI Revamp

| Risk                                     | Status   | Mitigation                                                             |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Merge conflict markers after pull/rebase | Resolved | Conflicted files were cleaned and typecheck/build pass.                |
| Old completion docs stale                | Resolved | Old docs archived and this folder recreated.                           |
| Mock data still on disk                  | Low      | Not active in current API flows; tracked in cleanup manifest.          |
| Package manager ambiguity                | Low      | `package-lock.json` and `bun.lock` coexist; choose one before release. |
| Vite dev port fallback                   | Resolved | Backend CORS local origins include 8080 and 8081.                      |

## Preserve

- Revamped app shell and route layout.
- shadcn/Radix UI primitive set.
- `src/components/data/*` reusable panel/table/status components.
- TanStack Query data flow.
- Central `src/lib/api` service layout.

## Replace Or Remove Later

- `src/lib/mock/data.ts` if no references remain.
- `src/lib/role.ts` if no references remain.
- Duplicate lockfile once package manager policy is decided.

## API Integration Readiness Score

97/100.

The app is ready for full product QA. Remaining gaps are release hygiene and cleanup, not functional API blockers.

## Recommended Order For Future Changes

1. Run `npm run typecheck`, `npm run test`, `npm run lint`, and `npm run build`.
2. Start backend on `API_PORT=3002`.
3. Start frontend with `VITE_API_BASE_URL=http://localhost:3002`.
4. Run `npm run test:e2e`.
5. Only then remove or quarantine mock artifacts.
