# Fastify Dependency Policy

## Preferred backend dependencies

Use latest stable compatible versions already resolved by package manager.

Suggested categories:

- Fastify core
- Fastify cookie plugin
- Fastify multipart plugin
- Fastify CORS plugin
- Fastify Swagger/OpenAPI plugin
- Fastify Swagger UI plugin
- Type provider if validation schemas need integration
- Existing telemetry/metrics packages from current repo
- Existing Drizzle/PostgreSQL packages from current repo
- Existing Valkey package from current repo
- Existing MinIO/S3 package from current repo

## Forbidden

Do not add:

- Prisma
- @prisma/client
- Supabase runtime
- Firebase
- MongoDB/Mongoose
- Neon serverless runtime
- paid SaaS dependency
- frontend UI dependencies
- cloud-only SDK for core operations

## Rule

Prefer keeping existing packages over adding new packages.

Add a dependency only when:

1. it is needed for backend runtime,
2. it is open-source/on-prem compatible,
3. it does not violate AGENTS.md,
4. tests are added,
5. package.json is updated intentionally.
