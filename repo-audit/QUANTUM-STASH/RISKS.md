# QUANTUM-STASH Risks

- Uses Neon serverless runtime (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/index.ts:3`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/index.ts:4`), which is rejected for final production.
- README explicitly positions DB as Postgres on Neon (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/README.md:43`).
- Uses NextAuth 5 beta (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/package.json:87`).
- Uses Resend/React Email in README (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/README.md:46`), a paid/cloud dependency risk for core notifications.
- Schema has explicit TODOs for key inventory relations (`QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:126`, `QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/src/db/schema/index.ts:156`).
- No tests or Docker support found.

