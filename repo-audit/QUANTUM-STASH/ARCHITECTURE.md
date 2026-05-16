# QUANTUM-STASH Architecture

## Structure

- Single Next.js app under `src/` with `actions`, `app`, `components`, `config`, `db`, `providers`, `styles`, `types`, and `validations`.
- Server actions are used for auth, warehouses, and inventory (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/actions/auth.ts:1`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/actions/warehouses.ts:1`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/actions/inventory/categories.ts:1`).
- UI has app sections for home dashboard, inventory, purchases, sales, and settings; many pages guard with `auth` and `redirect` (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/app/(app)/app/home/dashboard/page.tsx:1`).

## Runtime Boundaries

- Drizzle client uses `@neondatabase/serverless` and `drizzle-orm/neon-http` (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/index.ts:3`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/index.ts:4`).
- Validation uses Zod schemas for auth, inventory, warehouses, and email (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/validations/inventory.ts:4`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/validations/auth.ts:33`).

## Deployment/Devops

- README states Vercel hosting and Neon DB (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/README.md:43`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/README.md:50`).
- No local Docker dependency stack found.

