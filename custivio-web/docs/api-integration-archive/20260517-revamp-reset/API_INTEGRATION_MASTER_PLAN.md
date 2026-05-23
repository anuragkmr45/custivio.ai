# API Integration Master Plan

## Mission

Integrate `custivio-web` with the Fastify backend in `../custivio` so the UI uses real API data, cookie-backed auth, backend-enforced permissions, file flows, worker-backed jobs, and UAT seed data.

## Source Of Truth

- Backend API contract: `../custivio/docs/engineering/API_CONTRACT.md`
- Frontend handoff: `../custivio/docs/engineering/FRONTEND_HANDOFF.md`
- API examples: `../custivio/docs/engineering/FRONTEND_API_EXAMPLES.md`
- Test data: `../custivio/docs/engineering/FRONTEND_TEST_DATA.md`
- Active backend routes: `../custivio/apps/api/src/routes/**`
- OpenAPI schemas: `../custivio/apps/api/src/openapi/schemas.ts`

## Current Frontend State

- Framework: Vite + React + TanStack Router/Start.
- Data layer: mock arrays in `src/lib/mock/data.ts`.
- Auth: `src/lib/auth.ts` stores a mock flag in `localStorage`.
- State/data fetching: `@tanstack/react-query` is installed and provided in `src/routes/__root.tsx`, but route screens mostly read static fixtures.
- Tests: no test files and no `test` or `typecheck` script yet.
- Package manager evidence: `bun.lock` exists; `package.json` scripts use npm-compatible commands.

## Implementation Order

1. Establish control docs, audit, baseline commands, and task board.
2. Add central API client and tests.
3. Replace localStorage auth with backend cookie session.
4. Integrate read-only module lists first to preserve UI behavior.
5. Add mutations and forms one module at a time.
6. Integrate uploads/downloads and idempotency-sensitive workflows.
7. Clean old mocks after real data coverage is proven.
8. Run full system checks and write final UAT/readiness reports.

## Non-Negotiable Integration Rules

- Browser requests use `credentials: "include"`.
- JSON requests send `Accept: application/json`.
- Multipart upload uses `FormData` without manually setting `Content-Type`.
- Idempotency-sensitive mutations generate unique `idempotencyKey`.
- UI code does not call backend internals, Valkey, MinIO, or database directly.
- Backend API contract wins when frontend assumptions differ.

## Initial Risk Assessment

- High: current auth is explicitly mock/localStorage and must be replaced before protected UI can be trusted.
- High: all business pages currently use mock data, so integration is broad.
- Medium: no test harness exists yet, so API client tests require adding test scripts/dependencies.
- Medium: backend default port may conflict locally; use `VITE_API_BASE_URL=http://localhost:3002` if needed.

## Completion Criteria

- Central API layer handles errors, files, idempotency, query/path params, and session credentials.
- All visible business modules fetch and mutate through API services.
- Mock data is removed or quarantined after replacement.
- Lint, typecheck, unit/integration tests, build, backend smoke, and product UAT are documented.
- Final audit reports 95%+ frontend/API integration readiness.
