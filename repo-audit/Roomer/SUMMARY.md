# Roomer Summary

## Identification

- Framework: Fastify TypeScript API plus React/Vite frontend (`Roomer/README.md:124`, `Roomer/README.md:126`, `Roomer/apps/api/package.json:33`, `Roomer/apps/web/package.json:33`).
- Database and ORM: PostgreSQL with Prisma (`Roomer/README.md:125`, `Roomer/apps/api/package.json:28`, `Roomer/apps/api/package.json:41`).
- Auth/RBAC: password auth plus enterprise OIDC/SAML/SCIM routes and roles (`Roomer/apps/api/src/routes/auth.ts:15`, `Roomer/apps/api/src/routes/auth-enterprise.ts:64`, `Roomer/apps/api/src/routes/scim.ts:44`, `Roomer/README.md:29`).
- Storage: local filesystem storage for floor plans and lease documents (`Roomer/apps/api/src/lib/storage.ts:21`, `Roomer/apps/api/src/routes/leases.ts:219`).
- Docker support: Compose includes PostgreSQL, Mailpit, API, and web (`Roomer/docker-compose.yml:5`, `Roomer/docker-compose.yml:22`, `Roomer/docker-compose.yml:32`, `Roomer/docker-compose.yml:76`).
- Tests: no test files found in repository scan.
- License: Elastic License 2.0 (`Roomer/LICENSE:1`).

## Maturity

Strong enterprise/self-hosting reference for RBAC, SCIM, webhooks, bookings, bulk import, health, and metrics. It is Prisma/Elastic-licensed and cannot be direct source code.

## Recommendation

Reference only. Use concepts for location hierarchy, assignments, imports, observability, and enterprise auth.

