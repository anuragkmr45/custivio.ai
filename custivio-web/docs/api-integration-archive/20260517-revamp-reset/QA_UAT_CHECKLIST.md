# QA And UAT Checklist

## Technical Flows

- [x] Admin can log in with UAT credentials.
- [x] `/api/auth/me` restores session on refresh.
- [x] Logout clears the backend session.
- [x] Unauthenticated protected route redirects to login.
- [x] Permission-denied state is visible for restricted actions.
- [x] Catalog data lists from backend.
- [x] Location hierarchy lists from backend.
- [x] Asset search finds `UAT-LAP-001`.
- [x] Asset detail loads by backend UUID resolved from list endpoint.
- [x] Asset attachment upload/download/delete is wired through authorized API routes.
- [x] Stock movement generates idempotency key and prevents double submit while pending.
- [x] Custody checkout/checkin/handover forms/actions are wired.
- [x] Transfer request approval/rejection is wired.
- [x] Maintenance ticket create/status update and warranty create/list are wired.
- [x] Audit campaign and scan forms are wired.
- [x] Import job create/process/status flow is wired.
- [x] Export job create/status/download flow is wired.
- [x] Status page shows health, readiness, ops, metrics/OpenAPI links.

## Product UAT Questions

- [x] Can a non-technical user understand each page?
- [x] Is the primary action obvious?
- [x] Are labels business-friendly?
- [x] Are empty states helpful?
- [x] Are loading states clear?
- [x] Are errors clear and tied to request IDs where useful?
- [x] Does success feedback confirm what happened? Global mutation success/error toasts are wired.
- [x] Can QA reproduce each flow from docs?
- [x] Does the workflow reduce Excel/manual tracking?

## Latest UAT Notes

- Repeatable `bun run test:e2e` smoke passed for all main authenticated routes and real backend data flows with the admin UAT user.
- Lower-permission store UAT user produced expected 403 behavior on admin APIs during browser smoke.
- Advanced user/role update, reset-password, catalog/location update, asset update and lifecycle-event controls are now wired.
- Product workflow coverage is sufficient for full product QA entry. Remaining items are UI polish and post-QA cleanup, not API integration blockers.
