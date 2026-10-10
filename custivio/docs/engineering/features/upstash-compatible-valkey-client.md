# Upstash-Compatible Valkey Client

## Scope

- Owning module: `packages/cache`.
- Affected consumers: Fastify dependency health, rate limits, idempotency, locks, queues, and import/export workers.
- API routes and worker entrypoints are unchanged because they consume the existing cache package API.
- Database tables and migrations: none.
- Forbidden dependencies: none; `ioredis` is an MIT-licensed Redis/Valkey protocol client and no Upstash SDK is introduced.

## Change

The cache package uses `ioredis` behind its existing Valkey client adapter. The previous GLIDE standalone client authenticated to Upstash but rejected the service because Upstash does not expose primary-discovery metadata in the form GLIDE expected. The new adapter supports both local Valkey and Upstash native Redis over TLS.

Existing cache behavior remains unchanged:

- conditional writes and expiry for idempotency and locks;
- FIFO list operations for queues and dead-letter queues;
- counters and TTLs for rate limits;
- short-lived connections closed after each operation.

## Compatibility and migration risk

- On-prem Valkey continues to use `VALKEY_HOST`, `VALKEY_PORT`, and optional credentials without TLS.
- Upstash uses the same variables plus `VALKEY_USERNAME=default`, `VALKEY_PASSWORD`, and `VALKEY_USE_TLS=true`.
- No stored key format, queue payload, cache key, API contract, or database schema changes.
- Rolling back only requires restoring the previous client dependency and adapter; stored Valkey data remains compatible.

## Tests and manual QA

1. Run the cache configuration and primitive tests.
2. Run typecheck, lint, formatting, full tests, API tests, and the forbidden-dependency check.
3. Confirm `checkValkeyHealth` returns `ok: true` against Upstash TLS.
4. Confirm local Valkey health still passes without TLS or credentials.
5. Enqueue and claim a small import/export job and verify the worker closes its connection.
