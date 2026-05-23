# ESLint And Code Quality Policy

## Enforced Rules

- Strict TypeScript.
- Import ordering.
- Import cycle detection.
- No floating promises.
- No explicit `any` outside tests and scripts.
- No uncontrolled `console` usage outside scripts and telemetry.
- No direct `process.env` reads outside `packages/config`.
- No forbidden runtime dependency imports.
- No direct DB, Valkey, or MinIO imports from web code.

## Forbidden Runtime Dependencies

- `prisma`
- `@prisma/client`
- Supabase runtime packages
- Firebase runtime packages
- MongoDB and Mongoose
- Neon serverless runtime packages
- Paid SaaS dependencies for core operations

## Local Quality Gate

Run:

```bash
pnpm check
```
