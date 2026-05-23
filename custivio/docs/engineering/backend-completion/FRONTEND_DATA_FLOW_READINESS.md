# Frontend Data Flow Readiness

## Purpose

Track whether frontend developers can build against real APIs and real seeded data.

## Current Readiness

| Flow                          | API ready | Seed data ready | Notes                                                                                               |
| ----------------------------- | --------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Login/current user            | Yes       | Yes             | Local-only users are seeded by `pnpm db:seed:uat`.                                                  |
| Admin users/roles/assignments | Yes       | Yes             | Administrator, asset manager, store user, and auditor accounts are seeded.                          |
| Catalog                       | Yes       | Yes             | Hardware/network categories, asset types, custom fields, manufacturers, models, and vendor.         |
| Locations                     | Yes       | Yes             | HQ site/building/floor/room/rack/shelf/bin hierarchy is seeded.                                     |
| Assets                        | Yes       | Yes             | Laptop, server, and network switch sample assets are seeded.                                        |
| Attachments                   | Yes       | API-generated   | Authorized streaming, checksum, MIME, size, and delete policy are ready; upload via API.            |
| Stock                         | Yes       | Yes             | Cable, consumable, and component stock items include balances and ledger entries.                   |
| Custody/transfers             | Yes       | Yes             | Laptop custody assignment and pending handover request are seeded.                                  |
| Maintenance                   | Yes       | Yes             | Server maintenance ticket, event, and warranty are seeded.                                          |
| Audits                        | Yes       | Yes             | Campaign, scan result, and finding are seeded.                                                      |
| Imports/exports/jobs          | Yes       | Yes             | Import preview rows and pending export metadata are seeded; create export via API to test download. |
| OpenAPI typed clients         | Yes       | N/A             | Component schemas and route metadata are tested.                                                    |

## Required Deliverables

- `packages/db/src/seed-uat.ts`: complete.
- `pnpm db:seed:uat`: complete.
- `docs/engineering/FRONTEND_API_EXAMPLES.md`: complete.
- `docs/engineering/FRONTEND_TEST_DATA.md`: complete.
- `docs/engineering/api-smoke.http`: complete.
- UAT seed idempotency tests: complete in `tests/integration/uat-seed.test.ts`.
- Rate-limit and idempotency conflict examples: documented in API/handoff examples.
