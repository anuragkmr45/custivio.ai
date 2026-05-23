# Product Manager Frontend QA Run - 2026-05-21

Environment: local dev with Docker data services  
Frontend: `http://localhost:8080`  
API: `http://localhost:3002`  
Backend repo: `custivio/`  
Frontend repo: `custivio-web/`

## Setup Result

| Step                | Result | Evidence                                                                                     |
| ------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Docker daemon       | PASS   | `docker info` succeeded after elevated Docker access.                                        |
| Dev data services   | PASS   | `pnpm docker:dev` started PostgreSQL, Valkey, MinIO, Prometheus, Grafana, OTel, and Mailpit. |
| DB migrations       | PASS   | `pnpm db:migrate` completed.                                                                 |
| Base seed           | PASS   | `pnpm db:seed` completed.                                                                    |
| UAT seed            | PASS   | `pnpm db:seed:uat` completed.                                                                |
| API readiness       | PASS   | `GET /api/health/ready` returned `ready` for postgres, valkey, and minio.                    |
| UAT admin login API | PASS   | `POST /api/auth/login` returned `200` with `custivio_session` cookie and 19 permission keys. |

## Automated Gates

| Gate                            | Result             | Notes                                                                                                                                                                                             |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend `npm run typecheck`    | PASS               | TypeScript passed.                                                                                                                                                                                |
| Frontend `npm run lint`         | PASS_WITH_WARNINGS | Existing shadcn Fast Refresh warnings only.                                                                                                                                                       |
| Frontend `npm run test`         | PASS               | 4 files, 26 tests passed.                                                                                                                                                                         |
| Frontend `npm run build`        | PASS               | Vite client and SSR builds passed.                                                                                                                                                                |
| Frontend/API `npm run test:e2e` | PASS               | 12 checks passed: routes, auth, session restore, catalog/locations, assets, attachments, stock, custody/transfers, maintenance/warranty, audit/import/export/reports, ops/status, logout and 401. |
| Backend `pnpm build:api`        | PASS               | API TypeScript build passed.                                                                                                                                                                      |
| Backend `pnpm lint`             | PASS               | ESLint passed.                                                                                                                                                                                    |
| Backend `pnpm test:api`         | PASS               | 9 files, 25 tests passed.                                                                                                                                                                         |

## Browser Route Sweep

Logged in as `admin.uat@inventory.local` and opened every main page from the frontend. All business API calls were triggered from the frontend and returned `200`.

| Page                             | Result | Frontend-triggered backend APIs observed                                                                                         |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard `/`                    | PASS   | `/api/auth/me`, `/api/assets`, `/api/custody/checkouts`, `/api/stock/items`, `/api/maintenance/tickets`, `/api/audits/campaigns` |
| Assets `/assets`                 | PASS   | `/api/auth/me`, `/api/assets`, `/api/catalog/types`, `/api/catalog/models`, `/api/catalog/vendors`                               |
| Catalog `/catalog`               | PASS   | `/api/catalog/*`, `/api/locations/*`                                                                                             |
| Stock `/stock`                   | PASS   | `/api/auth/me`, `/api/stock/items`                                                                                               |
| Custody `/custody`               | PASS   | `/api/auth/me`, `/api/custody/checkouts`                                                                                         |
| Maintenance `/maintenance`       | PASS   | `/api/auth/me`, `/api/maintenance/tickets`, `/api/assets`, `/api/maintenance/warranties`                                         |
| Audit & Reports `/audit-reports` | PASS   | `/api/auth/me`, `/api/assets`, `/api/audits/campaigns`, `/api/imports/jobs`, `/api/reports/exports`, `/api/reports/filters`      |
| Status `/status`                 | PASS   | `/api/auth/me`, `/api/metrics`, `/api/ops/status`, `/api/health/ready`                                                           |
| Users `/users`                   | PASS   | `/api/auth/me`, `/api/admin/users`, `/api/admin/assignments`, `/api/admin/roles`                                                 |
| Roles `/roles`                   | PASS   | `/api/auth/me`, `/api/admin/roles`                                                                                               |
| Assignments `/assignments`       | PASS   | `/api/auth/me`, `/api/admin/users`, `/api/admin/roles`, `/api/admin/assignments`                                                 |

## Browser Feature Checks

| Feature                   | Result | Evidence                                                                                                                                                                                                                  |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register asset            | PASS   | Browser submitted form; `/api/assets` returned `201`; created asset `PMQA-1779347563837` visible in registry.                                                                                                             |
| Create catalog category   | PASS   | Browser submitted form; `/api/catalog/categories` returned `201`; created category `pmqa-category-1779347667909` visible.                                                                                                 |
| Stock receive movement    | PASS   | Browser submitted movement; `/api/stock/movements` returned `201`; success feedback shown.                                                                                                                                |
| Create maintenance ticket | PASS   | Browser submitted ticket; `/api/maintenance/tickets` returned `201`; created ticket `PM QA maintenance 1779347563837` visible.                                                                                            |
| Create audit campaign     | PASS   | Browser submitted campaign; `/api/audits/campaigns` returned `201`; created campaign `PM QA campaign 1779347563837` visible.                                                                                              |
| Create import preview     | PASS   | Browser action triggered `/api/imports/jobs` with `201`; list refreshed.                                                                                                                                                  |
| Create export             | PASS   | Browser action triggered `/api/reports/exports` with `201`; list refreshed.                                                                                                                                               |
| Dialog availability       | PASS   | Verified primary dialogs for assets, catalog, locations, stock item/movement, custody checkout/transfer, maintenance ticket/warranty, audit campaign/scan, saved filter, user invite, role creation, and role assignment. |

## Role Accessibility

| Persona         | Sidebar result                                                                                                       | Direct forbidden route result                                                                                   | API behavior                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Administrator   | Dashboard, Assets, Catalog, Stock, Custody, Maintenance, Audit & Reports, Users, Roles, Assignments, Status visible. | N/A                                                                                                             | Admin pages loaded with `200` business APIs.                                     |
| Asset Manager   | Dashboard, Assets, Catalog, Stock, Custody, Maintenance, Status visible. Audit/admin links hidden.                   | `/audit-reports` showed friendly `No Audit & Reports access`; admin routes showed access denied.                | Forbidden direct routes only called `/api/auth/me`, not forbidden business APIs. |
| Inventory Clerk | Dashboard, Assets, Stock, Custody, Status visible. Catalog, Maintenance, Audit & Reports, admin links hidden.        | `/catalog`, `/maintenance`, `/audit-reports`, `/users`, `/roles`, `/assignments` showed friendly denial states. | Forbidden direct routes only called `/api/auth/me`, not forbidden business APIs. |
| Auditor         | Dashboard, Assets, Stock, Custody, Maintenance, Audit & Reports, Status visible. Catalog/admin links hidden.         | `/catalog`, `/users`, `/roles`, `/assignments` showed friendly denial states.                                   | Forbidden direct routes only called `/api/auth/me`, not forbidden business APIs. |

## Findings

| ID           | Severity | Finding                                                                                                                                                                                                                                     | Status              |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| PMQA-ENV-001 | P2       | Local frontend must be opened at `http://localhost:8080` when `VITE_API_BASE_URL=http://localhost:3002`. Opening `http://127.0.0.1:8080` creates a browser cookie host mismatch and causes page-load API calls to return `401` after login. | DOCUMENTED          |
| PMQA-UI-001  | P3       | Browser console shows missing `favicon.ico` from the dev frontend.                                                                                                                                                                          | NON_BLOCKING        |
| PMQA-UX-001  | P3       | `Create import preview` and `Create export` are immediate actions, not dialogs. They work, but product owner should confirm this is the desired interaction.                                                                                | ACCEPTED_FOR_SURVEY |

## Product Manager Verdict

Current local-dev PM frontend/API QA result: `PASS_WITH_NOTES`

The frontend is ready for a product-owner walkthrough on local dev when accessed through `http://localhost:8080` with the seeded backend running on `http://localhost:3002`.
