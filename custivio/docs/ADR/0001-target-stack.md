# ADR 0001: Target Stack

## Status

Accepted.

## Decision

The platform is a fresh implementation using:

- Next.js App Router, React, and TypeScript.
- PostgreSQL with Drizzle ORM.
- Valkey for cache, locks, queues, idempotency, and rate limits.
- MinIO/S3-compatible object storage for attachments and generated files.
- Docker Compose for local development services.
- OpenTelemetry, Prometheus, and Grafana for observability.
- Zod for runtime configuration and request validation.

## Consequences

- Prisma, Supabase runtime dependencies, Firebase, MongoDB, Neon serverless runtime dependencies, and paid SaaS core dependencies are rejected.
- The audit repositories are design references only. Source code is not copied.
- All production storage must go through MinIO/S3-compatible APIs, not local filesystem paths.
