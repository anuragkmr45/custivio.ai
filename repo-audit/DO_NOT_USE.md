# Do Not Use

## Strict Rejections

- Prisma runtime/schema/code:
  - Sanchay: `Sanchay/prisma/schema.prisma`, `Sanchay/src/lib/db.ts:1`
  - Roomer: `Roomer/apps/api/prisma/schema.prisma`
  - PartPilot: `PartPilot/prisma/schema.prisma`, `PartPilot/lib/prisma.ts:4`
  - Panthora: `panthora/packages/app/prisma/schema.prisma`
- Supabase runtime code:
  - SAMS: `SAMS/package.json:42`, `SAMS/src/lib/supabaseClient.ts:1`, `SAMS/src/services/audit.ts:34`
  - SAMS Vercel Supabase rewrites: `SAMS/vercel.json:5`, `SAMS/vercel.json:8`
- Neon/serverless-only DB code:
  - QUANTUM-STASH: `src/db/index.ts` imports Neon serverless (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/index.ts:3`)
  - ChittyAssets: `chittyassets/server/db.ts:1`, `chittyassets/server/db.ts:2`
- AGPL/Elastic/O'Saasy code copying:
  - PartPilot AGPL: `PartPilot/LICENSE:1`
  - Roomer Elastic License: `Roomer/LICENSE:1`
  - ce O'Saasy restriction: `ce/LICENSE.md:1`, `ce/LICENSE.md:8`
- Cloud-only/paid SaaS assumptions:
  - Resend in QUANTUM-STASH README (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/README.md:46`)
  - Resend in Sanchay mail utilities (`Sanchay/src/lib/mail.ts:1`)
  - Clerk/Replit/Cloudflare/Vercel ChittyAssets patterns (`chittyassets/server/chittyAuth.ts:7`, `chittyassets/README.md:138`, `chittyassets/README.md:144`, `chittyassets/README.md:151`)
- Demo/local fallback auth or persistence:
  - SAMS localStorage auth/ticket fallback (`SAMS/src/services/auth.ts:148`, `SAMS/src/services/tickets.ts:38`)
  - Filadex default admin password (`filadex/server/auth.ts:94`, `filadex/server/auth.ts:95`)
  - Roomer README demo/admin passwords (`Roomer/README.md:188`, `Roomer/README.md:206`)

## Patterns To Rewrite, Not Copy

- PGLite as primary runtime (`FinOpenPOS/README.md:87`, `FinOpenPOS/README.md:458`).
- Embedded PostgreSQL in application Docker images (`FinOpenPOS/Dockerfile.production:2`, `FinOpenPOS/Dockerfile.production:42`).
- Redis-only naming/config from ce; target must use Valkey (`ce/docker-compose.yml:244`).
- File uploads to local filesystem as primary storage (`Roomer/apps/api/src/lib/storage.ts:21`).
- JSON file metadata without object storage source-of-truth (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:158`).
- AI/demo/blockchain code that is outside enterprise inventory core (`filadex/README.md:7`, `chittyassets/README.md:3`, `chittyassets/shared/schema.ts:195`).

## Required Replacement Rules

- Use Drizzle migrations only.
- Use PostgreSQL only.
- Store files in MinIO and metadata in PostgreSQL.
- Use Valkey for cache, locks, idempotency, queues, and rate limits.
- Every protected mutation must perform tenant and permission checks.
- Every important mutation must write audit logs.
- Every import/export must be validated, job-tracked, and idempotent.

