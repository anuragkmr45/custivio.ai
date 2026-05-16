# filadex Architecture

## Structure

- `client/` contains the React frontend.
- `server/` contains Express routes and storage/auth utilities.
- `shared/schema.ts` contains Drizzle schema and Zod insert schemas.

## Runtime Boundaries

- Express routes are grouped by feature: auth, users, filaments, batch, settings, public sharing, statistics, and theme (`filadex/server/routes/index.ts:4`, `filadex/server/routes/index.ts:11`).
- Route handlers use Drizzle directly through `db` imports (`filadex/server/routes/filaments.ts:3`, `filadex/server/routes/settings.ts:3`).
- Auth middleware attaches user details from JWT (`filadex/server/auth.ts:29`, `filadex/server/auth.ts:49`).

## Deployment/Devops

- Compose template uses `postgres:15-alpine` (`filadex/docker-compose.template.yml:6`) and injects `DATABASE_URL` into the app (`filadex/docker-compose.template.yml:34`).
- Dockerfile installs PostgreSQL client tooling (`filadex/Dockerfile:31`).

