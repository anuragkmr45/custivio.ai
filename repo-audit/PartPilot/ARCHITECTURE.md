# PartPilot Architecture

## Structure

- Next.js App Router project with `app/`, `components/`, `lib/`, `prisma/`, and `public/`.
- Prisma client wrapper at `PartPilot/lib/prisma.ts:4`.
- API routes exist under `app/api/parts` and `app/api/auth`.

## Runtime Boundaries

- Parts API route handlers use Next route handlers (`PartPilot/app/api/parts/route.ts:6`, `PartPilot/app/api/parts/route.ts:18`).
- Create/update/delete/search endpoints exist under `app/api/parts/*` (`PartPilot/app/api/parts/create/route.ts:7`, `PartPilot/app/api/parts/update/route.ts:4`, `PartPilot/app/api/parts/delete/route.ts:4`, `PartPilot/app/api/parts/search/route.ts:24`).
- Register route validates with Zod (`PartPilot/app/api/auth/register/route.tsx:3`, `PartPilot/app/api/auth/register/route.tsx:15`).
- Barcode scanning uses `onscan.js` in dashboard (`PartPilot/app/dashboardPage.tsx:28`, `PartPilot/app/dashboardPage.tsx:45`).

## Deployment/Devops

- Compose uses PostgreSQL and app service with Prisma connection string (`PartPilot/docker-compose.yml:4`, `PartPilot/docker-compose.yml:19`).
- Release compose uses published image and PostgreSQL (`PartPilot/docker-compose-release.yml:4`, `PartPilot/docker-compose-release.yml:15`).

