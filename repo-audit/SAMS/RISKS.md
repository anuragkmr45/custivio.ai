# SAMS Risks

- Supabase is a core runtime dependency (`SAMS/README.md:91`, `SAMS/package.json:42`), rejected for final production.
- Vercel/Supabase rewrites are checked in (`SAMS/vercel.json:5`, `SAMS/vercel.json:8`), not air-gap friendly.
- No license found; treat as reference-only.
- Demo credentials are published in README (`SAMS/README.md:164`).
- LocalStorage fallback is used for auth/tickets and should not be production pattern (`SAMS/src/services/tickets.ts:38`, `SAMS/src/services/auth.ts:148`).
- Tests are planned/in-progress, not established (`SAMS/README.md:137`).
- No Drizzle schema, Docker, Valkey, or MinIO evidence found.

