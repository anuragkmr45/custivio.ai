# QA Environment Runbook

Status: local Docker QA environment verified on 2026-05-17.

## Local QA Values

| Variable               | Value                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `QA_API_BASE_URL`      | `http://localhost:3003`                                                                                      |
| `QA_FRONTEND_BASE_URL` | `http://localhost:8081`                                                                                      |
| `QA_TENANT_SLUG`       | `default`                                                                                                    |
| `QA_ADMIN_EMAIL`       | Backend env key `UAT_ADMIN_EMAIL` from `/private/tmp/eip-qa.env`                                             |
| `QA_ADMIN_PASSWORD`    | Backend env key `UAT_SEED_PASSWORD` from `/private/tmp/eip-qa.env`; default local value `UatInventoryPass1!` |
| QA API image           | `custivio-api:qa-local`                                                                                      |
| QA compose file        | `/private/tmp/eip-qa-compose.yml`                                                                            |
| QA env file            | `/private/tmp/eip-qa.env`                                                                                    |

## Local QA Service Ports

| Service          | Host port | Notes                                                                              |
| ---------------- | --------: | ---------------------------------------------------------------------------------- |
| API              |    `3003` | Backend app listens on container port `3000`; host URL is `http://localhost:3003`. |
| Frontend preview |    `8081` | Built frontend preview with `VITE_API_BASE_URL=http://localhost:3003`.             |
| Postgres         |   `55432` | QA database only.                                                                  |
| Valkey           |   `56379` | QA cache/idempotency only.                                                         |
| MinIO API        |    `9100` | QA object storage API.                                                             |
| MinIO console    |    `9101` | QA object storage console.                                                         |
| Prometheus       |    `9091` | QA metrics scrape.                                                                 |
| Grafana          |    `3032` | QA dashboard shell.                                                                |

## Backend QA Setup

Run from `custivio/`.

```bash
docker build -f infra/Dockerfile.api -t custivio-api:qa-local .
docker compose -f /private/tmp/eip-qa-compose.yml up -d postgres valkey minio minio-init prometheus grafana
docker compose -f /private/tmp/eip-qa-compose.yml run --rm api pnpm db:migrate
docker compose -f /private/tmp/eip-qa-compose.yml run --rm api pnpm db:seed
docker compose -f /private/tmp/eip-qa-compose.yml run --rm api pnpm db:seed:uat
docker compose -f /private/tmp/eip-qa-compose.yml up -d api worker
API_BASE_URL=http://127.0.0.1:3003 pnpm smoke:api
```

Source-code gates are run from the backend source workspace, not from the production runtime image:

```bash
pnpm check
pnpm build:api
pnpm test:api
DATABASE_URL=postgresql://custivio:custivio_qa@localhost:55432/custivio \
VALKEY_HOST=localhost \
VALKEY_PORT=56379 \
MINIO_ENDPOINT=http://localhost:9100 \
MINIO_ACCESS_KEY=minioqa \
MINIO_SECRET_KEY=minioqa123456 \
APP_BASE_URL=http://localhost:3003 \
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081 \
COOKIE_SECURE=false \
RUN_DB_TESTS=1 \
pnpm test
```

## Frontend QA Setup

Run from `custivio-web/`.

```bash
VITE_API_BASE_URL=http://localhost:3003 npm run typecheck
VITE_API_BASE_URL=http://localhost:3003 npm run lint
VITE_API_BASE_URL=http://localhost:3003 npm run test
VITE_API_BASE_URL=http://localhost:3003 npm run build
npm run preview -- --host 0.0.0.0 --port 8081
E2E_API_BASE_URL=http://127.0.0.1:3003 E2E_FRONTEND_BASE_URL=http://127.0.0.1:8081 npm run test:e2e
```

## QA Execution Order

1. Build fresh API image.
2. Start local QA Docker dependencies.
3. Apply migrations with the same fresh image used for seeding and runtime.
4. Seed baseline and UAT data.
5. Start API and worker.
6. Run API smoke and backend source gates.
7. Run frontend static/build gates.
8. Start frontend preview.
9. Run frontend E2E and browser checks.
10. Run persona permission checks for admin, manager, store, and auditor.
11. Update QA matrix, defect log, test log, product-owner survey, and final audit.

## Important Notes

- Do not run `pnpm check` inside the production runtime API image; it intentionally does not include the full source lint config. Run static source gates from `custivio/`.
- Always rebuild `custivio-api:qa-local` after backend source or migration changes.
- If frontend preview returns `500`, rebuild frontend and confirm `dist/server/server.js` exists. The frontend `postbuild` script creates that compatibility entry.
- CORS must include both dev and QA local frontend origins while both are used: `http://localhost:8080`, `http://127.0.0.1:8080`, `http://localhost:8081`, and `http://127.0.0.1:8081`.
