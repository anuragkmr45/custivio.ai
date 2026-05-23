# Oracle Always Free Docker Deployment

1. Create an Oracle Always Free VM with Ubuntu.
2. Install Docker Engine and Docker Compose.
3. Clone the Custivio workspace.
4. Copy `custivio/.env.cloud-showcase.example` to `.env` and set real secrets.
5. Configure a domain and HTTPS reverse proxy.
6. Start backend services with Docker Compose.
7. Run migrations and seeds:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:seed:uat
```

8. Expose only HTTPS for the API/reverse proxy.
9. Keep PostgreSQL, Valkey, MinIO, and observability ports private.

Validation:

- `/api/health/live` returns 200.
- `/api/health/ready` returns 200.
- `/api/openapi.json` returns Custivio OpenAPI.
- UAT admin can log in from the hosted frontend.
