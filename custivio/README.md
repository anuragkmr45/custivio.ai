# Custivio Backend

Backend-only on-prem and air-gapped inventory and IT asset management platform.

This repository provides the Fastify API, PostgreSQL/Drizzle schema, Valkey cache/queue primitives, MinIO storage integration, observability, deployment configuration, tests, seed data, and operations documentation. Frontend UI implementation is out of scope for this repo.

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- Docker Desktop or Docker Engine with Compose

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The Fastify API runs on `http://localhost:3000` by default in local development. If that port is already occupied, use an override such as `API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start`.

On startup the API prints the exact local URLs to the terminal:

```text
Fastify API ready
  Local:   http://localhost:3002
  Health:  http://localhost:3002/api/health/live
  OpenAPI: http://localhost:3002/api/openapi.json
  Docs:    http://localhost:3002/api/docs
```

The development CORS allowlist includes common local frontend origins such as `http://localhost:8080`, `http://localhost:8081`, `http://localhost:5173`, and `http://localhost:5177`. If your frontend uses a different origin, start the API with an explicit allowlist:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:8080 API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start
```

## API Endpoints For Frontend Integration

- OpenAPI JSON: `GET /api/openapi.json`
- Swagger UI: `GET /api/docs`
- Liveness: `GET /api/health/live`
- Readiness: `GET /api/health/ready`
- Metrics: `GET /api/metrics`
- Operations status: `GET /api/ops/status`
- Auth/session: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

The frontend team should use `docs/engineering/API_CONTRACT.md` and `docs/engineering/FRONTEND_HANDOFF.md` as the source of truth for route shapes and auth behavior.

## Scripts

```bash
pnpm dev              # Start Fastify API in watch mode
pnpm build            # Typecheck/build Fastify API
pnpm start            # Start Fastify API
pnpm test:api         # API route tests
pnpm check            # typecheck + lint + format + tests + forbidden dependency check
pnpm db:generate      # Drizzle migration generation check
pnpm db:migrate       # Apply Drizzle migrations
pnpm db:seed          # Idempotent base seed
pnpm db:bootstrap-admin # Create first production tenant/admin from env values
pnpm docker:dev       # Start local PostgreSQL, Valkey, MinIO, Mailpit, OTel, Prometheus, Grafana
```

## Seed Data

Base seed creates the default tenant, permissions, roles, role permissions, and a seed audit event. It does not create production admin credentials.

Production/bootstrap installs must create the first tenant administrator from explicit operator-provided environment variables:

```bash
BOOTSTRAP_TENANT_SLUG=acme-it \
BOOTSTRAP_TENANT_NAME="Acme IT" \
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_NAME="Tenant Administrator" \
BOOTSTRAP_ADMIN_PASSWORD="UseAUniqueStrongPassword123" \
pnpm db:bootstrap-admin
```

The bootstrap CLI refuses missing values, weak passwords, and invalid tenant slugs. It is idempotent for the same tenant/admin and never creates default production credentials.

UAT/dev seed data for frontend real-flow testing is available through:

```bash
pnpm db:seed
pnpm db:seed:uat
```

The UAT seed creates local-only users, roles, locations, catalog records, assets, stock, custody, maintenance, audit, import, and export metadata. See `docs/engineering/FRONTEND_TEST_DATA.md`.

The local UAT login emails and password are read from backend env keys in `.env`: `UAT_ADMIN_EMAIL`, `UAT_MANAGER_EMAIL`, `UAT_STORE_EMAIL`, `UAT_TECHNICIAN_EMAIL`, `UAT_APPROVER_EMAIL`, `UAT_AUDITOR_EMAIL`, `UAT_VIEWER_EMAIL`, and `UAT_SEED_PASSWORD`.

## Verification

```bash
pnpm check:forbidden
pnpm check
pnpm build:api
pnpm test:api
RUN_DB_TESTS=1 pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:seed
docker build -f infra/Dockerfile.api .
docker compose --env-file infra/env.production.validation.example -f infra/docker-compose.prod.yml config
```

Some DB and Docker checks require local PostgreSQL/Docker access outside restricted sandboxes.

## Deployment

Production and air-gapped deployment details live under `docs/operations/`:

- `PRODUCTION_DEPLOYMENT.md`
- `OFFLINE_RELEASE_BUNDLE.md`
- `AIR_GAP_DEPLOYMENT.md`
- `BACKUP_RESTORE.md`
- `BACKUP_RESTORE_REHEARSAL.md`
- `RELEASE_CHECKLIST.md`

This repository is a fresh Custivio implementation.

## Proxmox deployment model

Custivio supports a Proxmox deployment model for on-prem and air-gapped environments:

- `custivio-app` unprivileged LXC: frontend artifact, Fastify API, worker, Caddy or Nginx reverse proxy, and systemd services.
- `custivio-data` VM: PostgreSQL, MinIO, Valkey, persistent data paths, and backup/restore scripts.
- `shared-observability` LXC or VM: reusable Grafana, Prometheus, Loki, and OpenTelemetry Collector for multiple organizations and software systems.

The Proxmox deployment docs live under `deploy/proxmox/`. Start with:

- `deploy/proxmox/docs/PROXMOX_DEPLOYMENT_INDEX.md`
- `deploy/proxmox/docs/DEPLOYMENT_PATH_STRATEGY.md`
- `deploy/proxmox/docs/NEW_OPERATOR_QUICKSTART.md`
- `deploy/proxmox/docs/UPDATE_PATCH_RUNBOOK.md`
- `deploy/proxmox/docs/ROLLBACK_RUNBOOK.md`

Canonical runtime paths:

- Active app release: `/opt/custivio/current`
- App releases: `/opt/custivio/releases/<version>`
- App secrets: `/etc/custivio/custivio.env`
- Data VM storage: `/srv/custivio-data/postgres`, `/srv/custivio-data/minio`, `/srv/custivio-data/valkey`
- Backups: `/var/backups/custivio`
- Shared observability: `/opt/shared-observability`, `/etc/shared-observability`, `/srv/shared-observability`

Build and deployment flow:

```bash
bash deploy/proxmox/custivio-release/build-release-bundle.sh <version>
bash deploy/proxmox/custivio-release/verify-release-bundle.sh dist/custivio-<version>.tar.gz
bash deploy/proxmox/scripts/validate-all.sh
```

Deploy a release on the app LXC with the release install script, validate with `deploy/proxmox/custivio-app-lxc/verify-app.sh`, and rollback with `deploy/proxmox/custivio-app-lxc/rollback-release.sh <previous-version>`. Frontend/API integration docs remain in the frontend repository, and backend API contract docs remain under `docs/engineering/`.
