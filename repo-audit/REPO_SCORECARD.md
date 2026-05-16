# Repo Scorecard

Scoring: 0 = not present/unusable, 1 = very weak, 2 = partial, 3 = usable with changes, 4 = strong, 5 = excellent/directly reusable.

| Repo | Stack match | Domain fit | DB/schema | Auth/RBAC | Storage | Docker | Tests | License risk | Security risk | Keep/Reject/Reference | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|
| FinOpenPOS | 4 | 2 | 4 | 3 | 0 | 3 | 5 | Low | Medium | Keep as reference | Modern Next/Drizzle/tRPC/test reference; default PGLite and POS domain limit reuse. |
| dashboard-boilerplate | 4 | 0 | 2 | 2 | 4 | 4 | 0 | Unknown | Medium | Reference | Good Postgres/Drizzle/MinIO/Compose baseline; no license and no domain logic. |
| QUANTUM-STASH | 3 | 3 | 2 | 3 | 1 | 0 | 0 | Low | Medium-high | Reference | Inventory UI/actions are useful; Neon, no Docker/tests, schema TODOs. |
| filadex | 2 | 2 | 3 | 2 | 1 | 3 | 0 | Low | High | Reference | Self-hosted Drizzle inventory; Vite/Express, AI-coded, default admin risk. |
| bffless/ce | 3 | 1 | 4 | 4 | 5 | 5 | 5 | High | Medium | Reference only | Strong storage/RBAC/devops/testing; O'Saasy license and non-inventory domain. |
| SAMS | 1 | 5 | 1 | 1 | 1 | 0 | 0 | Unknown | High | Reference only | Strong asset lifecycle UX; Supabase/Vercel/localStorage/no schema/no license. |
| Sanchay | 2 | 5 | 3 | 3 | 0 | 0 | 0 | Unknown | High | Reference only | Excellent hardware domain model; Prisma, no license, no tests/Docker. |
| Roomer | 2 | 4 | 4 | 5 | 2 | 4 | 0 | High | Medium | Reference only | Enterprise RBAC/import/metrics ideas; Prisma and Elastic License. |
| PartPilot | 2 | 3 | 2 | 2 | 0 | 3 | 0 | High | High | Reference only | Electronics parts/barcode concepts; AGPL and not production ready. |
| Panthora | 2 | 4 | 4 | 3 | 0 | 3 | 3 | Low | Medium | Reference | Asset types/custom fields/labels/team ideas; Prisma/Meilisearch. |
| ChittyAssets | 2 | 2 | 3 | 1 | 1 | 1 | 3 | Medium | High | Reference only | Drizzle asset/evidence ideas; Neon, cloud auth, blockchain/AI scope. |

## Ranking

1. FinOpenPOS: best implementation-quality Next/Drizzle/test reference.
2. dashboard-boilerplate: best simple infrastructure reference for Postgres/Drizzle/MinIO/Compose, pending license review.
3. bffless/ce: best storage/RBAC/devops/testing reference, but license prevents direct copying.
4. QUANTUM-STASH: best direct Next/Drizzle inventory UI reference, but incomplete and Neon-based.
5. Panthora: best generic asset type/custom field/label concept reference, but Prisma.
6. Roomer: best enterprise RBAC/location/import/observability concept reference, but Prisma/Elastic.
7. SAMS: best asset lifecycle, QR, tickets, audit, and reports product reference, but Supabase/no schema.
8. Sanchay: strong hardware inventory schema concepts, but Prisma/no license.
9. filadex: useful self-hosted inventory CRUD/settings/statistics reference, but narrow domain and no tests.
10. PartPilot: useful parts/barcode concept reference, but AGPL/not production ready.
11. ChittyAssets: selective evidence/timeline ideas only; Neon/cloud/blockchain/AI risks dominate.

