# SAMS Architecture

## Structure

- Vite SPA with `src/pages`, `src/components`, `src/services`, `src/hooks`, and `src/lib`.
- README describes React Query/context/local caching fallbacks (`SAMS/README.md:90`).
- Supabase client centralizes remote backend access (`SAMS/src/lib/supabaseClient.ts:1`, `SAMS/src/lib/supabaseClient.ts:23`, `SAMS/src/lib/supabaseClient.ts:58`).

## Runtime Boundaries

- Service modules directly call `supabase.from(...)` and `supabase.rpc(...)` for domain operations (`SAMS/src/services/audit.ts:34`, `SAMS/src/services/audit.ts:50`, `SAMS/src/services/tickets.ts:165`, `SAMS/src/services/approvals.ts:240`).
- Multiple services fall back to localStorage/demo data when Supabase is missing or failing (`SAMS/README.md:124`, `SAMS/src/services/tickets.ts:38`, `SAMS/src/services/auth.ts:133`).
- Vercel rewrite/proxy targets a Supabase project (`SAMS/vercel.json:5`, `SAMS/vercel.json:8`).

## Deployment/Devops

- README names Vercel as reference deployment (`SAMS/README.md:153`).
- No on-prem Docker dependency stack found.

