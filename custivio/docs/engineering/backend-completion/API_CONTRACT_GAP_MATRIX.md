# API Contract Gap Matrix

## Current API Contract State

- API contract doc exists: `docs/engineering/API_CONTRACT.md`.
- Fastify routes exist in `apps/api/src/routes/**`.
- OpenAPI endpoints exist:
  - `GET /api/openapi.json`
  - `GET /api/docs`
- Phase 2 added shared component schemas in `apps/api/src/openapi/schemas.ts` and route-level
  metadata across `apps/api/src/routes/**`.

## Gap Matrix

| Area              | Current status | Required completion                                                       | Frontend impact |
| ----------------- | -------------- | ------------------------------------------------------------------------- | --------------- |
| Health/readiness  | Ready          | OpenAPI schemas verified                                                  | Low             |
| Metrics           | Ready          | Text response schema documented; metric names are Phase 6 work            | Low             |
| Ops status        | Ready          | OpenAPI schemas verified                                                  | Low             |
| Auth/session      | Ready          | Request/response/error schemas added                                      | Low             |
| Admin users       | Ready          | Request/response/error schemas added                                      | Low             |
| Admin roles       | Ready          | Request/response/error schemas added                                      | Low             |
| Admin assignments | Ready          | Request/response/error schemas added                                      | Low             |
| Catalog           | Ready          | Params/body/response schemas added                                        | Low             |
| Assets            | Ready          | List/detail/create/update/lifecycle schemas added                         | Low             |
| Attachments/files | Partial        | OpenAPI schemas added; checksum policy remains Phase 4                    | High            |
| Locations         | Ready          | Route schemas added for hierarchy resources                               | Low             |
| Stock             | Ready          | Route schemas added; deeper idempotency/conflict contract remains Phase 5 | Medium          |
| Custody/transfers | Ready          | Workflow route schemas added                                              | Low             |
| Maintenance       | Ready          | Ticket/warranty/status route schemas added                                | Low             |
| Audits            | Ready          | Campaign/scan route schemas added                                         | Low             |
| Imports           | Partial        | Route schemas added; worker-backed status remains Phase 3                 | High            |
| Reports/exports   | Ready          | Export/filter/download schemas added                                      | Low             |
| OpenAPI/docs      | Ready          | Component schema count is greater than zero and route metadata is tested  | Low             |

## Required Tests

- `/api/openapi.json` returns paths. Covered by `apps/api/src/tests/health-routes.test.ts`.
- `/api/openapi.json` returns component schemas. Covered by `apps/api/src/tests/openapi-schema.test.ts`.
- Major route groups have schema metadata. Covered by `apps/api/src/tests/openapi-schema.test.ts`.
- Error envelope schema matches `apps/api/src/http/responses.ts`. Covered by `ErrorResponse` component and typed error response tests.
