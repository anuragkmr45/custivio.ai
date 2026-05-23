# Phase 3: Auth, RBAC, And Tenant Isolation

## Requirement

Implement DB-backed authentication, session management, tenant context, permission checks, protected app routes, and basic admin visibility for users, roles, and assignments.

## Scope

- Password credential and session schema.
- Password hashing and verification using Node crypto primitives.
- Session token creation, hashing, lookup, refresh, and revocation.
- Tenant-aware login/logout/current-user route handlers.
- Permission guard helpers backed by seeded RBAC tables.
- Protected app shell and middleware cookie gate.
- Read-only user, role, and assignment admin screens.
- Integration tests for login, inactive users, permission denial, logout, and tenant isolation.

## Out Of Scope

- Self-service signup.
- Password reset and email delivery.
- User creation UI.
- Role editor mutations.
- SSO/SAML/OIDC.
- Asset workflows.

## Affected Folders

- `packages/db/src/schema`
- `packages/db/src/repositories`
- `packages/auth/src`
- `apps/web/app`
- `apps/web/lib`
- `tests/integration`
- `docs/engineering`

## DB Changes

- Add password credential and session tables.
- Add indexes for tenant/user/session lookup.
- Keep session tokens stored only as hashes.
- No default application admin credentials are seeded.

## API/Server Actions

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/users`
- `GET /api/admin/roles`
- `GET /api/admin/assignments`

## UI Screens

- `/login`
- `/dashboard`
- `/admin/users`
- `/admin/roles`
- `/admin/assignments`
- `/unauthorized`

## Permission Rules

- Authenticated sessions resolve exactly one tenant and active user.
- Admin users screen requires `users.manage`.
- Admin roles and assignments screens require `roles.manage`.
- Permission checks are denied by default.

## Audit Log Rules

- Successful login writes `auth.login_success`.
- Failed login with a resolvable tenant writes `auth.login_failed`.
- Logout writes `auth.logout`.
- Permission denial writes no mutation but returns a typed authorization error with request ID at route boundaries.

## Tests

- Password hashing round trip.
- Successful tenant-scoped login.
- Invalid password rejection.
- Inactive user rejection.
- Permission denial for missing permission.
- Logout revokes session.
- Current session exposes tenant, user, and permission keys.

## Product Manager UAT Checklist

- Non-technical usability: login and admin screens use plain labels.
- Empty state: admin screens handle no rows.
- Error state: login failures show non-sensitive errors.
- Success feedback: authenticated dashboard shows current user and tenant.
- Business labels: permissions and admin pages use inventory/business terms.
- End-to-end workflow: test user can log in, view dashboard, and access permitted admin screens.
- Inventory usefulness: creates secure foundation for all later inventory workflows.
- UAT status: `passed`.

## Rollback/Migration Notes

- Migration is additive.
- Session/token tables can be dropped only after revoking active sessions.
- No credential seed is created, so rollback does not affect default credentials.

## Commands Run

- `pnpm install`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm format:check`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm test`
- `RUN_DB_TESTS=1 pnpm test`
- `pnpm check`
- `pnpm build`
- `npx tsx -e "<local-only QA admin setup>"`
- `pnpm --dir apps/web exec next dev --hostname 127.0.0.1 --port 3006`
- `curl -sS -i -c /tmp/eip-phase3-cookies.txt ... /api/auth/login`
- `curl -sS -i -b /tmp/eip-phase3-cookies.txt ... /api/auth/me`
- `curl -sS -i -b /tmp/eip-phase3-cookies.txt ... /api/admin/users`
- `curl -sS -i -b /tmp/eip-phase3-cookies.txt ... /api/admin/roles`
- `curl -sS -i -b /tmp/eip-phase3-cookies.txt ... /api/admin/assignments`
- `curl -sS -i ... /api/admin/users`
- `curl -sS -i -b /tmp/eip-phase3-cookies.txt -X POST ... /api/auth/logout`

## Verification Result

- Formatting, typecheck, lint, unit tests, forbidden dependency scan, migration, seed, DB integration tests, build, and HTTP route checks passed.
- `RUN_DB_TESTS=1 pnpm test` passed with 20 tests enabled.
- Login, current-user, admin users, admin roles, admin assignments, missing-session rejection, logout, and post-logout session rejection were verified over HTTP.
- No default app admin credentials were seeded. The QA admin was created manually in the local database only for route verification.
- Next.js 16.2.6 emits a non-fatal warning that `middleware.ts` is deprecated in favor of `proxy.ts`; keep this as a Phase 9 hardening item unless the roadmap moves it earlier.

## Known Gaps

- Password reset, user creation UI, role mutation UI, and `middleware.ts` to `proxy.ts` migration are later hardening/admin work.
