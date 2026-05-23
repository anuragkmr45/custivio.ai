# Deployment Troubleshooting

## API will not start
- Check `journalctl -u custivio-api -n 200 --no-pager`.
- Check `/etc/custivio/custivio.env` permissions and DB/Valkey/MinIO endpoints.
- Run `/opt/custivio/tools/verify-app.sh`.

## Worker is not processing jobs
- Check `journalctl -u custivio-worker -n 200 --no-pager`.
- Confirm Valkey is reachable from the app LXC.
- Confirm the worker uses the same `/opt/custivio/current` release as the API.

## Frontend loads but API fails
- Check reverse proxy route for `/api/*`.
- Confirm CORS allowed origins include the public HTTPS origin.
- Confirm API binds to localhost or private IP expected by the proxy.

## Data services fail
- Run `custivio-data-vm/verify-data-vm.sh`.
- Check disk free space and Docker Compose health status.

## Observability missing data
- Validate target files include `org`, `software`, `environment`, `role`, `instance` labels.
- Confirm Prometheus can reach private scrape targets.
- Confirm OTel endpoint is private and reachable from app LXC.
