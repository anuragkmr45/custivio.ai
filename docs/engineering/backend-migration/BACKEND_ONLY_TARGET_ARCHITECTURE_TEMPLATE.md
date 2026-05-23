# Backend-Only Target Architecture

## Runtime

- Node.js
- Fastify
- TypeScript
- PostgreSQL
- Drizzle ORM
- Valkey
- MinIO
- OpenTelemetry
- Prometheus
- Grafana

## Repository structure

```text
apps/api/
  src/
    app.ts
    server.ts
    plugins/
    routes/
    http/
    workers/
    tests/

packages/db/
packages/core/
packages/auth/
packages/storage/
packages/cache/
packages/config/
packages/telemetry/

infra/
  Dockerfile.api
  docker-compose.dev.yml
  docker-compose.prod.yml
```

## API contract

All APIs remain under:

```text
/api/*
```

## Frontend ownership

Frontend is external to this repository.

This backend must provide:

- OpenAPI JSON
- API docs
- stable error format
- stable auth/session contract
- upload/download contract
- pagination/filter contract
- rate limit behavior
- CORS rules for approved frontend origins
