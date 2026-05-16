# panthora Summary

## Identification

- Framework: Next.js app plus docs/website packages (`panthora/packages/app/package.json:43`, `panthora/packages/docs/package.json:14`, `panthora/packages/website/package.json:2`).
- Database and ORM: PostgreSQL with Prisma (`panthora/packages/app/package.json:30`, `panthora/packages/app/package.json:46`, `panthora/packages/app/package.json:84`).
- Auth: NextAuth with Prisma adapter (`panthora/packages/app/package.json:44`, `panthora/packages/app/src/server/auth/auth.ts:1`, `panthora/packages/app/src/server/auth/auth.ts:49`).
- Search: Meilisearch is in Docker Compose (`panthora/docker-compose.yml:18`).
- Docker support: Compose and Dockerfile exist (`panthora/docker-compose.yml:8`, `panthora/docker-compose.yml:30`, `panthora/Dockerfile`).
- Tests: Playwright/Vitest files exist (`panthora/packages/app/playwright.config.ts`, `panthora/packages/app/vitest.config.ts`, `panthora/packages/app/tests/e2e/assetTypeTable.spec.ts`).
- License: MIT-style root license (`panthora/LICENSE:1`, `panthora/LICENSE:3`).

## Maturity

Good generic inventory model reference for assets, asset types, custom fields, labels, tags, and teams. It is Prisma-based and appears evolving/pre-release by README language.

## Recommendation

Reference for asset type/custom field UX and label printing. Rewrite in Drizzle.

