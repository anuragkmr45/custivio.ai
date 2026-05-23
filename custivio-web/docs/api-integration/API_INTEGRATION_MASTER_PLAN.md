# Frontend API Integration Master Plan After Revamp

Report date: 2026-05-17

## Reset Decision

The previous `docs/api-integration/` completion state is treated as historical only because the UI was revamped. The old Markdown files were copied to:

```text
docs/api-integration-archive/20260517-revamp-reset/
```

The active integration state in this folder is rebuilt from the current `custivio-web` source tree and the backend contract in `custivio`.

## Source Of Truth

- Backend contract: `custivio/docs/engineering/API_CONTRACT.md`
- Frontend handoff: `custivio/docs/engineering/FRONTEND_HANDOFF.md`
- API examples: `custivio/docs/engineering/FRONTEND_API_EXAMPLES.md`
- UAT data: `custivio/docs/engineering/FRONTEND_TEST_DATA.md`
- Smoke collection: `custivio/docs/engineering/api-smoke.http`
- Backend readiness audit: `custivio/docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT_AFTER_COMPLETION.md`
- Active backend routes: `custivio/apps/api/src/routes/**`
- Frontend routes: `custivio-web/src/routes/**`
- Frontend API client: `custivio-web/src/lib/api/**`

## Current Frontend Stack

- Framework: TanStack Start with Vite.
- Runtime UI: React 19, TanStack Router, TanStack Query.
- Styling/components: Tailwind CSS v4, shadcn/Radix primitives, lucide icons.
- Validation/form style: native `FormData` handlers and typed request builders; `zod` and React Hook Form are available but not broadly used in current pages.
- Package scripts: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`.
- Current package-manager state: `package-lock.json` and `bun.lock` both exist. Verification used npm scripts because `package.json` is npm-compatible and no pnpm lock/workspace file is present in the frontend repo.

## Integration Strategy

1. Keep the backend contract authoritative.
2. Keep all HTTP traffic behind `src/lib/api/client.ts`.
3. Keep typed module services in `src/lib/api/*.ts`.
4. Use React Query in pages for loading/error/refetch behavior.
5. Use backend cookie session only; do not persist session tokens in local storage.
6. Use list endpoints to resolve IDs for forms and smoke flows.
7. Use backend attachment and export download routes only.
8. Use idempotency keys on stock/import/export mutations.
9. Preserve revamped UI components and connect them to real data.
10. Keep old mock data only as a cleanup candidate until references are proven absent.

## Completed Integration Surface

The revamped UI currently has live API-backed routes for:

- Login/session/logout.
- Protected app shell with permission-aware navigation.
- Dashboard summary.
- Admin users, roles, and assignments.
- Catalog and locations.
- Asset list, search, create, detail, edit, lifecycle, attachment upload/download/delete.
- Stock units, items, balances, low-stock, and movements.
- Custody checkout/checkin/handover and transfer requests.
- Maintenance tickets and warranties.
- Audits, imports, exports, saved filters, and export downloads.
- Health, readiness, ops status, metrics, OpenAPI, and docs links.

## Execution Order

| Order | Phase                       | Purpose                                           | Status              |
| ----: | --------------------------- | ------------------------------------------------- | ------------------- |
|     1 | Reset and UI audit          | Archive stale docs and re-audit revamped UI       | COMPLETE            |
|     2 | Central API client          | Confirm one API layer and client tests            | COMPLETE            |
|     3 | Auth/session/permissions    | Confirm cookie session, guards, nav permissions   | COMPLETE            |
|     4 | Dashboard bootstrap         | Confirm dashboard reads backend summaries         | COMPLETE            |
|     5 | Admin                       | Confirm users/roles/assignments flows             | COMPLETE            |
|     6 | Catalog/locations           | Confirm master data and hierarchy flows           | COMPLETE            |
|     7 | Assets/attachments          | Confirm registry and file flows                   | COMPLETE            |
|     8 | Stock                       | Confirm stock ledger and idempotent movement flow | COMPLETE            |
|     9 | Custody/transfers           | Confirm asset assignment and transfer flow        | COMPLETE            |
|    10 | Maintenance/warranty        | Confirm operational record flows                  | COMPLETE            |
|    11 | Audits/imports/reports/jobs | Confirm worker-backed job UX and downloads        | COMPLETE            |
|    12 | Ops/health/OpenAPI          | Confirm status surfaces                           | COMPLETE            |
|    13 | Cleanup                     | Classify stale mock/demo files                    | COMPLETE_WITH_NOTES |
|    14 | Full-system testing         | Run unit/build/e2e with backend                   | COMPLETE            |
|    15 | Product UAT                 | Record module-level usability assessment          | COMPLETE            |
|    16 | Final readiness audit       | Score readiness after revamp                      | COMPLETE            |

## Readiness Decision

The revamped frontend is compatible with the backend integration contract and has passed unit, build, and full-system smoke coverage. The remaining risks are release hygiene items, not product blockers:

- `package-lock.json` is untracked and coexists with `bun.lock`; choose one package manager before release tagging.
- `src/lib/mock/data.ts` and `src/lib/role.ts` remain as cleanup candidates but are not active integration blockers.
- ESLint has existing fast-refresh warnings in UI primitive files; lint exits successfully.
