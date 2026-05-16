# ce Summary

## Identification

- Framework: NestJS backend and React/Vite frontend (`ce/README.md:32`, `ce/README.md:34`).
- Database and ORM: PostgreSQL with Drizzle (`ce/README.md:32`, `ce/apps/backend/package.json:68`, `ce/apps/backend/package.json:82`, `ce/apps/backend/package.json:118`).
- Auth: SuperTokens and permission guards (`ce/README.md:32`, `ce/apps/backend/src/auth/session-auth.guard.ts:3`, `ce/apps/backend/src/permissions/permissions.service.ts`).
- Storage: Local, MinIO, S3, GCS, Azure adapters (`ce/README.md:13`, `ce/apps/backend/src/storage/minio.adapter.ts`, `ce/apps/backend/src/storage/s3.adapter.ts`).
- Cache/queues: ioredis dependency and Redis Compose service (`ce/apps/backend/package.json:72`, `ce/docker-compose.yml:244`).
- Docker support: extensive Compose and Docker files (`ce/docker-compose.yml:112`, `ce/docker-compose.yml:161`, `ce/docker-compose.yml:244`).
- Tests: substantial Jest/Vitest/Playwright coverage; 90 test/spec/config files found.
- License: O'Saasy with anti-SaaS competition restriction (`ce/package.json:44`, `ce/LICENSE.md:1`, `ce/LICENSE.md:8`).

## Maturity

Strong backend/storage/devops reference, but product domain is static asset/artifact hosting, not inventory management. License makes direct copying risky.

## Recommendation

Reference for storage adapter design, permissions testing, Docker profiles, and health checks only. Do not copy code without legal approval.

