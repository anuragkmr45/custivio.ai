# filadex Summary

## Identification

- Framework: React/Vite frontend with Express backend; package name is `rest-express` (`filadex/package.json:2`, `filadex/package.json:66`, `filadex/package.json:77`).
- Database and ORM: PostgreSQL and Drizzle (`filadex/README.md:42`, `filadex/package.json:63`, `filadex/package.json:76`).
- Auth: custom JWT/bcrypt auth (`filadex/server/auth.ts:2`, `filadex/server/auth.ts:3`, `filadex/server/routes/auth.ts:10`).
- Storage: server-side storage abstraction in `filadex/server/storage.ts`; no MinIO/S3 dependency found.
- Docker support: Dockerfile and Compose template (`filadex/Dockerfile`, `filadex/docker-compose.template.yml:6`, `filadex/docker-compose.template.yml:34`).
- Tests: no test files found.
- License: MIT (`filadex/package.json:5`, `filadex/LICENSE:1`).

## Maturity

Useful self-hosted inventory CRUD reference, but domain is 3D printing filament management. README states it is fully AI-coded (`filadex/README.md:7`, `filadex/README.md:212`), which raises production-review risk.

## Recommendation

Reference only for inventory filtering/statistics/self-hosting ideas. Rewrite all code and auth.

