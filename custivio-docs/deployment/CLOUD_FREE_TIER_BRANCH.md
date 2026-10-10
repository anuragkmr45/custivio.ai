# Cloud Free-Tier Branch

The `cloud/free-tier-deployment` branch is an isolated demonstration target. The on-prem and air-gapped deployment on `main` remains authoritative and unchanged.

## Topology

| Component               | Cloud demo target                         | Integration boundary                                  |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Frontend                | Existing TanStack Start Cloudflare target | `VITE_API_BASE_URL` only                              |
| API                     | Render Free web service                   | Existing Fastify Docker image                         |
| Background work         | Embedded in the Render API process        | Existing Valkey queues and processors                 |
| Database                | Supabase PostgreSQL                       | Standard PostgreSQL URL through Drizzle/`pg`          |
| Cache and queues        | Upstash                                   | Native Redis TLS through the cache adapter            |
| Attachments and exports | Supabase Storage                          | S3-compatible endpoint through the existing S3 client |

No provider SDK replaces the domain, authentication, database, cache, queue, or storage packages.

The cache adapter uses `ioredis` because it supports both local Valkey and Upstash's native TLS endpoint without requiring Upstash's REST SDK. Configure `VALKEY_USERNAME=default` for Upstash.

## Important limitations

- This target is for seeded demos, not customer production data.
- Render sleeps after inactivity, so the embedded worker pauses and in-flight jobs can be interrupted.
- Free-tier quotas, suspension rules, and availability can change.
- The cloud provider accounts remain an external operational requirement.
- Cloudinary is not used because it is not the required general S3-compatible attachment boundary.
- The current frontend is TanStack Start, not Next.js. Converting fifteen routed screens to Next.js is a separate product migration and is not required to deploy the current frontend.

See `custivio/docs/deployment/cloud-showcase/RENDER_DEMO_DEPLOYMENT.md` and `custivio/infra/env.cloud.example` for setup details.

## Validation recorded on 2026-10-10

| Gate                                                   | Result                                               |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Backend typecheck, lint, and format                    | PASS                                                 |
| Backend forbidden-dependency scan                      | PASS                                                 |
| Backend tests with local Valkey                        | PASS: 70 passed, 40 database-dependent tests skipped |
| Cloud configuration, cookie, and embedded-worker tests | PASS: 14 passed                                      |
| Fastify production Docker image build                  | PASS                                                 |
| Existing on-prem production Compose validation         | PASS                                                 |
| Frontend typecheck, lint, and format                   | PASS                                                 |
| Frontend tests                                         | PASS: 36 passed                                      |
| Frontend Cloudflare-targeted production build          | PASS                                                 |
| Render Blueprint YAML parse/format                     | PASS                                                 |

Live provider validation remains external because Supabase, Upstash, Render, and Cloudflare credentials are not stored in the repository.

## Manual cloud QA

1. Confirm the first Render start applies every Drizzle migration and the initial deploy hook bootstraps the administrator.
2. Confirm `/api/health/ready` reports PostgreSQL, Valkey, and S3 storage as ready.
3. Log in from the Cloudflare frontend and confirm the cross-site secure session cookie survives a page reload.
4. Upload, download, and delete a small attachment through the API; confirm no provider credential reaches the browser.
5. Run a small import and export while Render is awake; confirm the embedded worker claims each job within 30 seconds.
6. Allow Render to sleep, enqueue or retain a queued demo job, wake the API, and confirm processing resumes.
7. Confirm the Supabase bucket is private and that only server-side S3 credentials have full bucket access.
8. Re-run the on-prem production Compose validation before merging any shared configuration change back to `main`.
