# FinOpenPOS Architecture

## Structure

- Turborepo-style monorepo with `apps/web`, `apps/docs`, and packages for API, auth, config, DB, env, fiscal, and UI (`FinOpenPOS/README.md:139`, `FinOpenPOS/README.md:150`, `FinOpenPOS/package.json:2`).
- `apps/web` is the Next.js application; the README maps `app/`, `lib/db/`, tRPC, and fiscal persistence areas (`FinOpenPOS/README.md:139`, `FinOpenPOS/README.md:144`, `FinOpenPOS/README.md:146`).
- The fiscal package is designed as standalone TypeScript with no DB dependency (`FinOpenPOS/README.md:173`).

## Runtime Boundaries

- UI calls tRPC procedures; README states API procedures require Better Auth session cookies and tRPC provides type inference (`FinOpenPOS/README.md:284`).
- Data access uses Drizzle schema in `apps/web/src/lib/db/schema.ts` and shared package schema in `packages/db/src/schema.ts` (`FinOpenPOS/README.md:537`).
- Development defaults to PGLite in-process storage (`FinOpenPOS/README.md:458`); production Dockerfile switches toward PostgreSQL (`FinOpenPOS/Dockerfile.production:22`, `FinOpenPOS/Dockerfile.production:29`).

## Deployment/Devops

- Docker compose workflow is documented (`FinOpenPOS/README.md:353`, `FinOpenPOS/README.md:356`).
- Production Dockerfile installs PostgreSQL inside the image (`FinOpenPOS/Dockerfile.production:2`, `FinOpenPOS/Dockerfile.production:42`), which should not be copied into the target because the target requires Compose-managed services.

