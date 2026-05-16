# panthora Architecture

## Structure

- Monorepo packages: `packages/app`, `packages/docs`, `packages/website`.
- App uses tRPC routers for asset, asset type, tags, teams, search, stats, labels, and users (`panthora/packages/app/src/server/api/routers/asset.ts:8`, `panthora/packages/app/src/server/api/routers/assetType.ts:7`, `panthora/packages/app/src/server/api/routers/team.ts:14`).
- Application context wraps Prisma and service classes (`panthora/packages/app/src/server/lib/applicationContext.ts:1`, `panthora/packages/app/src/server/lib/applicationContext.ts:122`).

## Runtime Boundaries

- Protected tRPC procedures guard app APIs (`panthora/packages/app/src/server/api/routers/asset.ts:9`, `panthora/packages/app/src/server/api/routers/assetType.ts:8`).
- Asset type service handles custom fields through Prisma transactions (`panthora/packages/app/src/server/lib/asset-types/assetTypeService.ts:80`, `panthora/packages/app/src/server/lib/asset-types/assetTypeService.ts:89`).
- Server health router checks DB and Meilisearch (`panthora/packages/app/src/server/api/routers/server.ts:10`, `panthora/packages/app/src/server/api/routers/server.ts:20`).

## Deployment/Devops

- Compose starts PostgreSQL, Meilisearch, and app (`panthora/docker-compose.yml:8`, `panthora/docker-compose.yml:18`, `panthora/docker-compose.yml:30`).
- Docker start applies Prisma migrations (`panthora/packages/app/docker-start.sh:1`).

