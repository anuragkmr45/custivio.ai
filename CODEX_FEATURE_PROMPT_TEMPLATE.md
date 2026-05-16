# Codex Feature Prompt Template

Use this after Phase 1 when adding any new feature.

---

Implement the following feature in `enterprise-inventory-platform`:

## Feature request

<Paste feature request here>

## Mandatory process

Before coding:

1. Read `AGENTS.md`.
2. Read `docs/engineering/FOLDER_AND_BOUNDARY_RULES.md`.
3. Read `docs/engineering/DB_DRIZZLE_RULES.md`.
4. Read `docs/engineering/BACKEND_API_RULES.md`.
5. Create/update `docs/engineering/features/<feature-name>.md`.

Then implement in this order:

1. DB schema/migration if needed.
2. Repository changes.
3. Validation schema.
4. Core service.
5. Permission checks.
6. Audit log events.
7. Server action/route handler.
8. UI.
9. Tests.
10. QA docs.

## Hard constraints

- No Prisma.
- No Supabase runtime.
- No Firebase.
- No MongoDB.
- No Neon/serverless-only runtime.
- No paid SaaS dependency.
- No direct DB access from UI/client components.
- No MinIO/Valkey direct use from UI/client components.
- No tenant-unscoped queries for tenant-owned data.
- Every protected mutation validates input, checks permission, and writes audit log.

## Required verification

Run or explain why unable:

```bash
pnpm check
pnpm db:migrate
pnpm test
```

## Final report

Provide:

- files changed
- DB migrations created
- tests added
- commands run
- manual QA checklist
- risks/known gaps
- next recommended task
