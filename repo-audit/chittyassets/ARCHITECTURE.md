# chittyassets Architecture

## Structure

- `client/` React app, `server/` Express API, `shared/schema.ts` Drizzle schema.
- README lists client/server/shared/attached asset folders (`chittyassets/README.md:84`, `chittyassets/README.md:93`).
- API routes are centralized in `server/routes.ts`.

## Runtime Boundaries

- DB client uses Neon serverless pool and Drizzle Neon adapter (`chittyassets/server/db.ts:1`, `chittyassets/server/db.ts:2`).
- Protected asset routes use `requireChittyAuth` (`chittyassets/server/routes.ts:27`, `chittyassets/server/routes.ts:215`).
- Auth module imports Clerk Express middleware (`chittyassets/server/chittyAuth.ts:7`).

## Deployment/Devops

- README targets Replit, Cloudflare Workers, Vercel, and Docker (`chittyassets/README.md:13`, `chittyassets/README.md:138`, `chittyassets/README.md:144`, `chittyassets/README.md:151`, `chittyassets/README.md:157`).
- No Compose-managed PostgreSQL/Valkey/MinIO stack found.

