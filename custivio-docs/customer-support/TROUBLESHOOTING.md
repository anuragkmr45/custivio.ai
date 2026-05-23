# Custivio Troubleshooting

## API Is Not Ready

1. Check `/api/health/live` to confirm the API process is running.
2. Check `/api/health/ready` to confirm PostgreSQL, Valkey, and MinIO are reachable.
3. Check `/api/ops/status` for dependency status and request ID.
4. Review API logs with the request ID.
5. Confirm environment values for `DATABASE_URL`, `VALKEY_HOST`, `VALKEY_PORT`, `MINIO_ENDPOINT`, and `MINIO_BUCKET`.

## Login Fails

1. Confirm tenant slug, user email, and user status.
2. Confirm the session cookie is named `custivio_session`.
3. Confirm `COOKIE_SECURE` and frontend HTTPS settings match the environment.
4. Check auth rate-limit metrics if repeated login attempts fail.

## File Upload Or Download Fails

1. Confirm MinIO is ready and the configured bucket exists.
2. Confirm object storage credentials have bucket access.
3. Check attachment or export status in the API response.
4. Use request IDs to correlate API logs and object-storage errors.

## Stock Movement Fails

1. Confirm the user has inventory write permission.
2. Confirm the stock item exists and is active.
3. Confirm issue or transfer quantity does not create negative stock.
4. Check idempotency key reuse if the same request was retried.

