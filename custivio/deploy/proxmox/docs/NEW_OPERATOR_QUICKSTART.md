# New Operator Quickstart

## 1. Prepare App LXC

Create an unprivileged LXC named `custivio-app`. Install Node.js 22+, pnpm 10+, Caddy or Nginx, and systemd. Do not enable privileged mode or Docker-in-LXC.

## 2. Prepare Data VM

Create a VM named `custivio-data`. Install Docker Compose or bare-metal PostgreSQL, MinIO, and Valkey. Use `/srv/custivio-data` for data and `/etc/custivio-data` for config.

## 3. Prepare Shared Observability

Create an LXC or VM named `shared-observability`. Install Docker Compose. Deploy the sibling `shared-observability/` project.

## 4. Configure secrets

Create `/etc/custivio/custivio.env`, `/etc/custivio-data/*.env`, and `/etc/shared-observability/*.env`. Use strong values and mode `0640` where applicable.

## 5. Deploy first release

Upload `custivio-<version>.tar.gz` to the app LXC and run `deploy/proxmox/custivio-release/install-release-bundle.sh` or the installed `/opt/custivio/tools/deploy-release.sh`.

## 6. Run validation

Run `verify-app.sh`, `verify-data-vm.sh`, and `shared-observability/scripts/validate-config.sh`.

## 7. Open frontend

Open `https://<custivio-app-domain>/`.

## 8. Check API health

Open `https://<custivio-app-domain>/api/health/live` and `/api/health/ready`.

## 9. Check Grafana

Open the admin-only Grafana HTTPS URL and verify the Custivio dashboard.

## 10. Run backup test

Run a PostgreSQL backup and a restore rehearsal on non-production data before production signoff.
