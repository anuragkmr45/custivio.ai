# dashboard-boilerplate Architecture

## Structure

- Repository centers on `next-app/` (`dashboard-boilerplate/README.md:25`).
- README identifies `src/app`, `src/config`, `src/models`, and service folders (`dashboard-boilerplate/README.md:28`, `dashboard-boilerplate/README.md:34`, `dashboard-boilerplate/README.md:37`).
- Drizzle configuration is in `dashboard-boilerplate/next-app/src/config/drizzle.config.ts` (`dashboard-boilerplate/README.md:116`).

## Runtime Boundaries

- Next.js hosts frontend and API routes.
- Auth service handles credential sign-in and password hashing (`dashboard-boilerplate/next-app/src/services/auth.ts:6`, `dashboard-boilerplate/next-app/src/services/auth.ts:33`).
- Session storage uses Drizzle models (`dashboard-boilerplate/next-app/src/services/sessions.ts:1`, `dashboard-boilerplate/next-app/src/services/sessions.ts:11`).
- MinIO service wraps AWS SDK `PutObjectCommand` and `GetObjectCommand` (`dashboard-boilerplate/next-app/src/services/minio.ts:1`, `dashboard-boilerplate/next-app/src/services/minio.ts:2`).

## Deployment/Devops

- Compose services include PostgreSQL (`dashboard-boilerplate/docker-compose.yml:56`), Adminer (`dashboard-boilerplate/docker-compose.yml:70`), and MinIO (`dashboard-boilerplate/docker-compose.yml:81`).
- The target can adapt the Compose topology but should add Valkey, Mailpit, OTel collector, Prometheus, and Grafana.

