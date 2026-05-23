# Frontend Code Audit

## Summary

`custivio-web` is a Vite/TanStack Router React app with a polished mock UI foundation. This file records the initial pre-integration audit; the current completed state is tracked in `FRONTEND_API_INTEGRATION_FINAL_AUDIT.md`.

Initial API integration readiness score: 35/100.
Current API integration readiness score: 96/100.

## Current Folder Structure

```text
src/
  components/
    app-shell/
    data/
    ui/
  hooks/
  lib/
    auth.ts
    mock/data.ts
    utils.ts
  routes/
    login.tsx
    _authenticated.tsx
    _authenticated/*.tsx
  router.tsx
  routeTree.gen.ts
  styles.css
```

## Framework And Tooling

- Framework: Vite + React 19 + TanStack Router/Start.
- Query state: `@tanstack/react-query` is installed and provided at root.
- Forms: `react-hook-form`, `zod`, and Radix UI components are installed, but current pages mostly use static display tables.
- Package scripts now include `dev`, `build`, `build:dev`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`, `format`, and `format:check`.
- Lockfile: `bun.lock` exists. No `pnpm-lock.yaml` in frontend.

## Current Data Fetching Approach

- Active business pages use typed service wrappers under `src/lib/api/`.
- The central API client lives under `src/lib/api/client.ts`.
- React Query powers live backend data loading and mutation refreshes.
- `src/lib/mock/data.ts` is retained only as a cleanup/quarantine candidate until product QA signoff.

## Current Auth Handling

- `src/lib/auth.ts` uses backend cookie session calls through `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.
- No session token is stored in `localStorage`.
- Protected routes restore the backend session and redirect unauthenticated users to `/login`.

## Current Routes/Screens

- `/login`: mock login.
- `/`: dashboard based on mock assets, tickets, stock, transfers, audit log.
- `/assets`: mock asset table.
- `/assets/$assetId`: mock asset detail, lifecycle, custody placeholder, maintenance, attachments.
- `/catalog`: mock catalog tabs.
- `/stock`: mock stock items, balances, ledger.
- `/custody`: mock active custody and transfer requests.
- `/maintenance`: mock tickets and warranties.
- `/audit-reports`: mock campaigns, findings, import preview, exports, saved filters.
- `/users`: mock users.
- `/roles`: mock role permission matrix.
- `/assignments`: mock role assignment grid.
- `/status`: mock health/metrics/request IDs.

## Existing Mock Data

`src/lib/mock/data.ts` includes tenant/user fixtures, permissions, roles, users, locations, catalog records, assets, lifecycle, attachments, stock, custody, transfer requests, tickets, warranties, campaigns, findings, import rows, export jobs, filters, audit log, and health samples.

## Duplicated Or Risky Logic

- Permission keys do not match backend contract.
- Mock UUID-like IDs do not match backend UUIDs.
- Tenant code `ACME` does not match backend UAT tenant slug `default`.
- Auth persistence in localStorage violates backend security rules.
- Asset detail uses local loader lookup; this will fail once backend IDs are used unless refactored.
- Buttons for mutations exist but are not wired to forms or APIs.
- Status page displays mock Prometheus metrics instead of backend `/api/metrics`.

## What Should Be Preserved

- Route structure and page-level UI composition.
- UI primitives in `src/components/ui`.
- Data display components in `src/components/data`.
- App shell/sidebar/topbar layout.
- TanStack Router and React Query foundations.

## What Should Be Replaced

- `src/lib/auth.ts` mock implementation.
- Business imports from `src/lib/mock/data.ts`.
- Hardcoded dashboard metrics.
- Mock login defaults and demo text.
- Mock status/metrics output.

## Tests

Tests now exist for the API client, service endpoint mapping, auth/session helpers, and repeatable full-system smoke coverage.

## Integration Readiness

| Area                   | Score | Notes                                          |
| ---------------------- | ----: | ---------------------------------------------- |
| UI route coverage      |  8/10 | Major business modules have screens.           |
| Central API layer      |  0/10 | Missing.                                       |
| Auth integration       |  0/10 | Mock localStorage only.                        |
| Data mapping readiness |  5/10 | Tables map well conceptually but types differ. |
| Mutation readiness     |  2/10 | Buttons exist, forms/actions mostly missing.   |
| Test readiness         |  0/10 | No test runner configured.                     |
| Maintainability        |  7/10 | Components are modular and reusable.           |

Overall: 35/100.
