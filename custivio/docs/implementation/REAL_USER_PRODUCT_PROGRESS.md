# Custivio Real User Product Progress

Report date: 2026-05-22

## Current Phase

Complete. Final validation and real-user readiness audit are recorded.

## Completed

- Confirmed active repos: `custivio/`, `custivio-web/`, `shared-observability/`.
- Confirmed previous readiness audit was technical/product-QA readiness, not real browser UAT readiness.
- Confirmed frontend E2E is currently fetch/route smoke, not browser-click Playwright.
- Confirmed base/UAT seeds currently expose 4 seeded personas.
- Created all requested real-user backend and frontend control files before feature edits.
- Added env-driven production bootstrap CLI: `pnpm db:bootstrap-admin`.
- Expanded base roles and UAT seed credentials to seven personas.
- Made UAT seed credentials lazy so production DB imports do not depend on demo env values.
- Added backend and frontend persona matrices.
- Updated frontend permission policy and tests for seven personas.
- Added backward-compatible asset list `q`, `limit`, `offset`, and `pageInfo`.
- Added server-backed pagination/search support to the shared frontend `DataTable`.
- Added central API request timeout handling, typed timeout/abort/network errors, and low-network docs.
- Added attachment upload file-size feedback and 10 MiB client-side limit checks.
- Added conservative import/export job polling behavior that stops on terminal states.
- Added Playwright browser-click UAT and ran it against local backend/frontend services.
- Fixed CORS browser mutation preflights for frontend DELETE/FormData/idempotency flows.
- Filtered soft-deleted asset attachments out of asset detail responses.
- Fixed frontend fast-refresh warnings and cleared frontend npm audit moderate findings.
- Revalidated backend, frontend, DB seed idempotency, browser UAT, Proxmox, production Compose, and shared observability checks.

## In Progress

- None.

## Blockers

- None.

## Next Step

Proceed to real user UAT on a staging machine, then execute the cloud showcase deployment using the documented Oracle Always Free plus Netlify/Vercel path.
