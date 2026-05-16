# ce Architecture

## Structure

- Monorepo with `apps/backend` and `apps/frontend`; README identifies backend, frontend, and infrastructure stacks (`ce/README.md:32`, `ce/README.md:34`, `ce/README.md:36`).
- Backend uses NestJS modules for assets, auth, permissions, storage, deployments, projects, proxy rules, and settings.
- Drizzle schema is split into many feature files under `ce/apps/backend/src/db/schema/`; 39 schema files were found.

## Runtime Boundaries

- Session auth guard verifies SuperTokens sessions and attaches DB user role (`ce/apps/backend/src/auth/session-auth.guard.ts:40`, `ce/apps/backend/src/auth/session-auth.guard.ts:56`, `ce/apps/backend/src/auth/session-auth.guard.ts:66`).
- API-key guard supports API key auth with session fallback (`ce/apps/backend/src/auth/api-key.guard.ts:12`, `ce/apps/backend/src/auth/api-key.guard.ts:33`, `ce/apps/backend/src/auth/api-key.guard.ts:87`).
- Permission service implements direct and group project permissions (`ce/apps/backend/src/permissions/permissions.service.spec.ts:36`, `ce/apps/backend/src/permissions/permissions.service.spec.ts:50`, `ce/apps/backend/src/permissions/permissions.service.spec.ts:677`).
- Storage is pluggable through adapter interfaces and runtime switching (`ce/apps/backend/src/storage/dynamic-storage.adapter.ts:16`, `ce/apps/backend/src/storage/dynamic-storage.adapter.ts:42`).

## Deployment/Devops

- Compose includes PostgreSQL (`ce/docker-compose.yml:112`), MinIO (`ce/docker-compose.yml:161`), SuperTokens (`ce/docker-compose.yml:202`), Redis (`ce/docker-compose.yml:244`), backend, and frontend.
- Dev Compose has service profiles for PostgreSQL and MinIO (`ce/docker-compose.dev.yml:14`, `ce/docker-compose.dev.yml:34`).

