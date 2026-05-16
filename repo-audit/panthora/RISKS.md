# panthora Risks

- Prisma is core (`panthora/packages/app/prisma/schema.prisma`, `panthora/packages/app/src/server/lib/applicationContext.ts:1`).
- Uses Meilisearch service (`panthora/docker-compose.yml:18`); target requirements do not include it.
- No MinIO or Valkey evidence found.
- README encourages testing/contributing as it evolves (`panthora/README.md:77`), suggesting maturity should be reviewed before copying patterns.
- Do not copy Prisma or NextAuth Prisma adapter code (`panthora/packages/app/src/server/auth/auth.ts:1`, `panthora/packages/app/src/server/auth/auth.ts:49`).

