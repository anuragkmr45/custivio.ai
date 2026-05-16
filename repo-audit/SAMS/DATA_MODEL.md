# SAMS Data Model

## Schema Status

No checked-in database schema, migrations, Prisma schema, or Drizzle schema were found. The only files under `SAMS/supabase` are an Edge Function and Deno config (`SAMS/supabase/functions/send-email/index.ts`, `SAMS/supabase/functions/deno.json`).

## Referenced Supabase Tables

These are table names referenced by service code, not verified schema definitions:

- Audit: `audit_sessions`, `audit_assignments`, `audit_reviews`, `audit_incharge`, `audit_reports` (`SAMS/src/services/audit.ts:34`, `SAMS/src/services/audit.ts:72`, `SAMS/src/services/audit.ts:97`, `SAMS/src/services/audit.ts:205`, `SAMS/src/services/audit.ts:372`).
- Tickets: `tickets`, `ticket_events`, `user_property_access` (`SAMS/src/services/tickets.ts:29`, `SAMS/src/services/tickets.ts:291`, `SAMS/src/services/tickets.ts:216`).
- Approvals: `approvals`, `approval_events`, `app_users` (`SAMS/src/services/approvals.ts:40`, `SAMS/src/services/approvals.ts:244`, `SAMS/src/services/approvals.ts:89`).
- QR/reports/properties/assets are referenced through service variables or direct calls (`SAMS/src/services/qrcodes.ts:86`, `SAMS/src/services/reports.ts:37`, `SAMS/src/services/properties.ts:73`).

## Extraction Notes

Translate workflow concepts into fresh Drizzle tables; do not infer columns beyond code evidence.

