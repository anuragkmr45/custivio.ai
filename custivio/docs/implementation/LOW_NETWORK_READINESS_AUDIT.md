# Custivio Low Network Readiness Audit

Report date: 2026-05-22

## Current Finding

Custivio has baseline loading/error states, `AbortSignal` support, and now a central request timeout in the frontend API client. Asset registry pagination/search is server-backed, attachment upload has client-side size feedback, and reporting polling stops unless import/export jobs are active.

| Area              | Current state                                                                             | Risk                                                                             | Action              |
| ----------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------- |
| API requests      | Central client supports `signal` and `timeoutMs` with 20s default.                        | Very slow requests now return typed `request_timeout`.                           | COMPLETE            |
| Data pages        | Loading/error/retry panels exist.                                                         | Continue browser slow-flow validation.                                           | COMPLETE_WITH_NOTES |
| Tables            | Shared `DataTable` supports server search/pagination when metadata is provided.           | Remaining bounded lists stay client-mode.                                        | COMPLETE_WITH_NOTES |
| Jobs              | Import/export/status polling is conservative and stops without active statuses.           | Browser UAT expansion should cover active job states.                            | COMPLETE_WITH_NOTES |
| Uploads           | Asset attachment UI shows max size, pending file name/size, and blocks files over 10 MiB. | Progress percentage is not available from `fetch` upload.                        | COMPLETE_WITH_NOTES |
| Duplicate submits | Core forms disable pending mutation buttons; stock/import/export idempotency keys exist.  | Browser double-click test remains future hardening.                              | COMPLETE_WITH_NOTES |
| Backend limits    | Rate limits and upload limits exist.                                                      | Operator proxy compression/timeouts remain documented rather than enforced here. | COMPLETE_WITH_NOTES |

## Completed Fixes

- Added API timeout helper through `src/lib/api/client.ts`.
- Added `DataTable` server pagination/search mode.
- Added backward-compatible asset list `pageInfo` metadata.
- Added asset upload size feedback and 10 MiB client-side limit check.
- Added reporting job polling stop logic and last-updated display.

## Remaining Work

- Run browser slow/failure flows with the local API stack.
- Add true upload progress only if the product accepts an XHR-based upload helper later.
