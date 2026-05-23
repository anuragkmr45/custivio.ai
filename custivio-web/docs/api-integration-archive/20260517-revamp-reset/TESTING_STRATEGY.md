# Testing Strategy

## Current State

Frontend tests and repeatable full-system smoke coverage are now configured. Scripts include `dev`, `build`, `build:dev`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`, `format`, and `format:check`.

## Required Test Layers

- API client unit tests for request/response behavior.
- Auth/session tests for login, logout, current session, redirects, permission-derived navigation, and no localStorage token/session use.
- Module integration tests for each API wrapper.
- Route/component tests for loading, empty, success, error, 401, and 403 states.
- Full-system E2E/product flows against `custivio` with UAT seed data.

## Candidate Tooling

Use Vitest for unit/integration tests because the app is Vite-based. The current E2E layer is a dependency-light Node smoke runner in `scripts/e2e-smoke.mjs`; add Playwright later only if product QA needs browser DOM assertions beyond HTTP route and API-flow verification.

## Baseline Commands

Frontend baseline:

```bash
bun install
bun run format:check
bun run typecheck
bun run test
bun run lint
bun run build
bun run test:e2e
```

Run `test:e2e` with backend and frontend dev servers active and matching API/CORS settings.

Backend baseline:

```bash
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm db:seed:uat
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
```
