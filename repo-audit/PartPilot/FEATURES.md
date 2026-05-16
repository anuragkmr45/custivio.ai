# PartPilot Features

## Confirmed

- LCSC integration described in README (`PartPilot/README.md:52`).
- Barcode scanner functionality described in README (`PartPilot/README.md:54`) and scanner code exists (`PartPilot/app/dashboardPage.tsx:28`, `PartPilot/app/dashboardPage.tsx:45`).
- Parts list and create API routes (`PartPilot/app/api/parts/route.ts:6`, `PartPilot/app/api/parts/route.ts:18`, `PartPilot/app/api/parts/create/route.ts:7`).
- Search, autocomplete, update, and delete route files exist (`PartPilot/app/api/parts/search/route.ts:24`, `PartPilot/app/api/parts/autocomplete/route.ts:4`, `PartPilot/app/api/parts/update/route.ts:4`, `PartPilot/app/api/parts/delete/route.ts:4`).
- Category page reads Prisma-backed part data (`PartPilot/app/categories/page.tsx:4`).

## Not Found

- Drizzle, MinIO, Valkey, enterprise RBAC, maintenance, audit, tests.

