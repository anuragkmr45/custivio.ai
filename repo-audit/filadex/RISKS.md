# filadex Risks

- Not Next.js; target would need a full rewrite of app architecture.
- README states the project is fully AI-coded (`filadex/README.md:7`, `filadex/README.md:212`).
- Default admin credentials are documented (`filadex/README.md:108`, `filadex/README.md:169`), and code creates default admin with password `admin` if missing (`filadex/server/auth.ts:94`, `filadex/server/auth.ts:95`).
- JWT auth is custom and should not be copied without deep review (`filadex/server/auth.ts:13`, `filadex/server/auth.ts:29`).
- No automated tests found.
- No MinIO, Valkey, audit logging, tenant isolation, or enterprise RBAC evidence found.

