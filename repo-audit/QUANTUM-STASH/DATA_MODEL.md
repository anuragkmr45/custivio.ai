# QUANTUM-STASH Data Model

## Tables Found

Drizzle schema in `src/db/schema/index.ts`:

- Auth: `account`, `session`, `user`, `verificationToken` (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:19`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:50`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:65`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:91`).
- Inventory: `warehouse`, `category`, `brand`, `item`, `unit` (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:103`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:111`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:118`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:123`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:164`).

## Model Quality Notes

- The `item` table stores category, brand, units, and warehouse as strings with TODO comments to link IDs and define relations (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:126`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:149`).
- `images` are JSON typed as `StoredFile[]` but no object-storage persistence was found (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:158`).

