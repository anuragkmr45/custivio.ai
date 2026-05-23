# Drizzle And PostgreSQL Rules

## Required Flow

1. Update Drizzle schema in `packages/db/src/schema`.
2. Add repository or transaction helpers in `packages/db`.
3. Generate a Drizzle migration.
4. Add tests for constraints and repository behavior.
5. Update seed data only when needed.
6. Run migration and seed checks against PostgreSQL.

## Schema Rules

- Use PostgreSQL only.
- Use Drizzle ORM only.
- Every tenant-owned table must include a tenant foreign key.
- Add indexes for tenant, status, type, location, custodian, serial, asset tag, SKU, and date filters when those fields exist.
- Do not drop or rename columns without migration notes and backward compatibility review.
- Audit log tables are append-only unless a later ADR explicitly permits retention cleanup.

## Rejected Patterns

- Prisma schema or Prisma client code.
- Supabase-only migrations or runtime clients.
- Neon serverless-only database access.
- Migration scripts that mutate production data without an explicit rollback and QA note.
