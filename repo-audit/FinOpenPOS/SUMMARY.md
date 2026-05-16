# FinOpenPOS Summary

## Identification

- Framework: Next.js 16 App Router; README lists Next.js 16, React 19, Tailwind CSS 4, PGLite, and Drizzle (`FinOpenPOS/README.md:85`, `FinOpenPOS/README.md:86`, `FinOpenPOS/README.md:87`, `FinOpenPOS/README.md:88`).
- Frontend stack: React 19, Tailwind, Radix UI, Recharts (`FinOpenPOS/README.md:86`).
- Backend stack: tRPC procedures behind Better Auth session cookies (`FinOpenPOS/README.md:284`); routers use `protectedProcedure` (`FinOpenPOS/apps/web/src/lib/trpc/routers/products.ts:25`, `FinOpenPOS/apps/web/src/lib/trpc/routers/orders.ts:35`).
- Database and ORM: PGLite by default, Drizzle ORM (`FinOpenPOS/README.md:87`, `FinOpenPOS/README.md:88`); production migration to PostgreSQL is documented (`FinOpenPOS/README.md:464`, `FinOpenPOS/README.md:537`).
- Auth: email/password via Better Auth (`FinOpenPOS/README.md:41`).
- Storage: no MinIO/S3 evidence found in audited files; PGLite data is file-backed (`FinOpenPOS/README.md:458`).
- Docker: dev and production Dockerfiles are documented (`FinOpenPOS/README.md:166`, `FinOpenPOS/README.md:167`).
- Tests: README claims 840 tests across fiscal and tRPC suites (`FinOpenPOS/README.md:308`); test files exist under `FinOpenPOS/apps/web/src/lib/trpc/routers/__tests__/` and `FinOpenPOS/packages/fiscal/src/__tests__/`.
- License: MIT (`FinOpenPOS/LICENSE:1`).

## Maturity

Strong engineering reference for a modern TypeScript/Next/Drizzle monorepo, especially Drizzle schema style, typed API boundaries, validation, and tests. Domain fit is partial because it is POS/product inventory, not enterprise IT asset management.

## Recommendation

Keep as a primary architecture and testing reference. Rewrite concepts into the new PostgreSQL-only stack; do not inherit the default PGLite runtime.

