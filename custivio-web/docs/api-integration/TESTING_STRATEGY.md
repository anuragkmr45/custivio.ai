# Testing Strategy After Revamp

Report date: 2026-05-17

## Required Frontend Gates

```text
npm run typecheck
npm run test
npm run lint
npm run build
```

## Required Full-System Gate

With backend running on port 3002 and frontend running on port 8080 or 8081:

```text
E2E_API_BASE_URL=http://localhost:3002 E2E_FRONTEND_BASE_URL=http://localhost:8081 npm run test:e2e
```

Use the actual frontend port from Vite output.

## Backend Baseline Gates

From `custivio/`:

```text
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm db:seed:uat
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
```

If port 3000 is busy:

```text
API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start
```

## Unit Coverage

| Area         | Test file                      | Required behavior                                                               |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------- |
| API client   | `src/lib/api/client.test.ts`   | JSON success/errors, request ID, path/query params, FormData, blob, idempotency |
| API services | `src/lib/api/services.test.ts` | Endpoint mapping for business service modules                                   |
| Auth helpers | `src/lib/auth.test.ts`         | Permissions, display initials, no token storage behavior                        |

## Product Smoke Coverage

`scripts/e2e-smoke.mjs` covers:

1. Frontend authenticated routes respond.
2. Backend login.
3. Session restore.
4. Catalog and locations.
5. Asset list/search/detail/create.
6. Asset lifecycle and attachment upload/download/delete.
7. Stock movement with idempotency key.
8. Custody checkout/checkin and transfer create.
9. Maintenance ticket/status/warranty.
10. Audit campaign/scan, import/process, export/filter.
11. Ops, health, metrics, OpenAPI.
12. Logout and 401 after logout.

## Manual QA Coverage

Manual QA should repeat the product smoke as a user-facing check in Chrome:

- Admin login.
- Dashboard overview.
- Master data lists.
- Asset search `UAT-LAP-001`.
- New asset create/detail.
- Attachment upload/download.
- Stock receive movement.
- Custody checkout or transfer.
- Maintenance ticket.
- Audit scan.
- Import preview/process.
- Export create/download.
- Logout and 401 behavior.
- Lower-permission user navigation/denial behavior.

## Pass Criteria

The frontend can be marked ready for full product QA only when typecheck, tests, lint, build, and product smoke pass.
