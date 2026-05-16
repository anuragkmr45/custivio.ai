# Roomer Architecture

## Structure

- Monorepo with `apps/api`, `apps/web`, and `packages/shared` (`Roomer/README.md:363`).
- API is Fastify; frontend is React SPA (`Roomer/README.md:124`, `Roomer/README.md:126`).
- Shared Zod schemas live in `Roomer/packages/shared/src/schemas`.

## Runtime Boundaries

- API routes are organized by resources including assets, bookings, queue, import, users, groups, SCIM, webhooks, buildings, floors, and analytics.
- Auth routes include login/logout/refresh/me (`Roomer/apps/api/src/routes/auth.ts:15`, `Roomer/apps/api/src/routes/auth.ts:110`, `Roomer/apps/api/src/routes/auth.ts:137`, `Roomer/apps/api/src/routes/auth.ts:202`).
- Asset routes use `requireAuth` and shared schemas (`Roomer/apps/api/src/routes/assets.ts:246`, `Roomer/packages/shared/src/schemas/asset.ts:4`).
- Observability includes health and optional Prometheus metrics (`Roomer/apps/api/src/app.ts:239`, `Roomer/apps/api/src/app.ts:268`).

## Deployment/Devops

- Docker Compose starts PostgreSQL and Mailpit, then API and web with health dependencies (`Roomer/docker-compose.yml:5`, `Roomer/docker-compose.yml:22`, `Roomer/docker-compose.yml:36`, `Roomer/docker-compose.yml:68`).
- Helm chart files exist under `Roomer/charts/roomer`.

