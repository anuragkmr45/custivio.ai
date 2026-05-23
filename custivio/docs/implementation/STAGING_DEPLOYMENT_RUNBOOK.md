# Custivio Staging Deployment Runbook

Report date: 2026-05-23

Primary staging option: Proxmox

Secondary showcase option: Oracle Always Free VM

## Option A: Proxmox Staging

### Required Shape

| Area          | Requirement                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| App LXC       | 2 vCPU, 4 GB RAM minimum; 4 vCPU, 8 GB RAM preferred for pilot.                          |
| Data VM       | 4 vCPU, 8-16 GB RAM minimum; persistent storage under `/srv/custivio-data`.              |
| Observability | Optional 2 vCPU, 4-8 GB RAM node/LXC.                                                    |
| Public ports  | 443 required; 80 optional for redirect.                                                  |
| Private ports | API 3000, PostgreSQL 5432, MinIO 9000, Valkey 6379, OTLP 4317/4318, metrics scrape path. |
| DNS           | Staging frontend/API domain pointing to app LXC reverse proxy.                           |
| TLS           | Valid certificate from ACME or operator-provided cert/key.                               |
| Backup path   | `/var/backups/custivio` on data VM.                                                      |

### Required Secrets And Env

- `DATABASE_URL`
- `VALKEY_URL`
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
- `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `APP_BASE_URL`
- `OTEL_EXPORTER_OTLP_ENDPOINT` if observability is enabled
- Bootstrap env:

```bash
BOOTSTRAP_TENANT_SLUG=<slug>
BOOTSTRAP_TENANT_NAME=<name>
BOOTSTRAP_ADMIN_EMAIL=<email>
BOOTSTRAP_ADMIN_NAME=<name>
BOOTSTRAP_ADMIN_PASSWORD=<strong-password>
```

### Deployment Commands

Build and verify a release bundle from the release workstation:

```bash
cd custivio
bash deploy/proxmox/custivio-release/build-release-bundle.sh <version>
bash deploy/proxmox/custivio-release/verify-release-bundle.sh dist/custivio-<version>.tar.gz
```

Install data VM services on the Proxmox data VM:

```bash
cd deploy/proxmox/custivio-data-vm
sudo bash install-data-vm.sh
sudo bash verify-data-vm.sh
```

Install app LXC services on the Proxmox app LXC:

```bash
cd deploy/proxmox/custivio-app-lxc
sudo bash install-app-lxc.sh
sudo bash deploy-release.sh /path/to/custivio-<version>.tar.gz <version>
sudo bash verify-app.sh
```

Run database setup from the app LXC or release shell with staging env loaded:

```bash
pnpm db:migrate
pnpm db:bootstrap-admin
```

For demo-only staging, UAT seed may be used instead of production bootstrap:

```bash
pnpm db:seed
pnpm db:seed:uat
```

### Validation Commands

```bash
curl -fsS https://<staging-domain>/api/health/live
curl -fsS https://<staging-domain>/api/health/ready
curl -fsS https://<staging-domain>/api/openapi.json
curl -fsS https://<staging-domain>/api/metrics
```

Browser UAT against staging:

```bash
cd custivio-web
E2E_FRONTEND_BASE_URL=https://<staging-domain> \
E2E_API_BASE_URL=https://<staging-domain> \
E2E_ADMIN_EMAIL=<admin-email> \
E2E_PASSWORD=<password> \
npm run test:browser
```

### Rollback Commands

Rollback to an existing release on the app LXC:

```bash
cd /opt/custivio/tools
sudo bash rollback-release.sh <previous-version>
```

If data restore is required, use the backup/restore rehearsal runbook and restore only into the intended staging environment.

## Option B: Oracle Always Free Showcase VM

### Required Shape

| Area             | Requirement                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------- |
| VM               | Ubuntu on Oracle Always Free, Docker Engine, Docker Compose.                                |
| Public ports     | 443 required; 80 optional for redirect.                                                     |
| Private services | PostgreSQL, MinIO, Valkey, API, worker behind Docker/private bridge.                        |
| DNS              | Showcase domain or subdomain pointing to VM public IP.                                      |
| TLS              | Reverse proxy with valid HTTPS.                                                             |
| Frontend         | Either served by the VM reverse proxy or deployed to Netlify/Vercel with credentialed CORS. |

### Deployment Commands

```bash
git clone <repo-url>
cd inventory-research/custivio
cp .env.cloud-showcase.example .env
# Fill real secrets and public URLs.
docker compose -f infra/docker-compose.prod.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm db:seed:uat
```

### Validation Commands

```bash
curl -fsS https://<showcase-domain>/api/health/live
curl -fsS https://<showcase-domain>/api/health/ready
curl -fsS https://<showcase-domain>/api/openapi.json
```

### Limitations

- Oracle Always Free is acceptable for showcase staging, not final on-prem production proof.
- Ensure DB, MinIO, and Valkey ports are not publicly exposed.
- Free-tier CPU, disk, and network limits may affect browser UAT and import/export timing.
