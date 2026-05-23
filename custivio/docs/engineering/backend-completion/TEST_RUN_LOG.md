# Backend Completion Test Run Log

## Baseline Commands

| Time       | Command                                                          | Result | Notes                                                                                                                   |
| ---------- | ---------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm install`                                                   | PASS   | Lockfile already up to date. pnpm warned that dependency build scripts are ignored until approved.                      |
| 2026-05-16 | `pnpm check:forbidden`                                           | PASS   | Forbidden dependency check passed.                                                                                      |
| 2026-05-16 | `pnpm check`                                                     | FAIL   | Typecheck and lint passed; format check failed because newly created control Markdown files needed Prettier formatting. |
| 2026-05-16 | `pnpm exec prettier --write docs/engineering/backend-completion` | PASS   | Formatted all new control docs.                                                                                         |
| 2026-05-16 | `pnpm check`                                                     | PASS   | Typecheck, lint, format, non-DB tests, and forbidden dependency check passed.                                           |
| 2026-05-16 | `pnpm build:api`                                                 | PASS   | Fastify API TypeScript build passed.                                                                                    |
| 2026-05-16 | `pnpm test:api`                                                  | PASS   | 6 API test files, 14 tests passed.                                                                                      |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                                   | FAIL   | Sandbox blocked localhost PostgreSQL connections with `connect EPERM`.                                                  |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                                   | PASS   | Rerun with local DB access allowed; 19 test files, 60 tests passed.                                                     |
| 2026-05-16 | `pnpm db:generate`                                               | PASS   | Drizzle saw 47 tables and no schema changes.                                                                            |
| 2026-05-16 | `pnpm db:migrate`                                                | FAIL   | Sandbox blocked `tsx` local IPC pipe creation.                                                                          |
| 2026-05-16 | `pnpm db:migrate`                                                | PASS   | Rerun with local IPC/PostgreSQL access allowed.                                                                         |
| 2026-05-16 | `pnpm db:seed`                                                   | FAIL   | Sandbox blocked `tsx` local IPC pipe creation.                                                                          |
| 2026-05-16 | `pnpm db:seed`                                                   | PASS   | Rerun with local IPC/PostgreSQL access allowed.                                                                         |
| 2026-05-16 | `pnpm db:seed`                                                   | PASS   | Second idempotency seed run passed with local IPC/PostgreSQL access allowed.                                            |
| 2026-05-16 | `pnpm docker:dev`                                                | FAIL   | Sandbox could not access Docker daemon socket.                                                                          |
| 2026-05-16 | `pnpm docker:dev`                                                | PASS   | Rerun with Docker daemon access allowed; dev services started.                                                          |
| 2026-05-16 | `docker compose -f infra/docker-compose.dev.yml ps`              | PASS   | Postgres, Valkey, MinIO, and Mailpit healthy; Prometheus, Grafana, and OTel running.                                    |

## Phase Test Results

### Phase 1 - Backend-Only Ownership Cleanup

| Time       | Command                                  | Result | Notes                                                                                                 |
| ---------- | ---------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm install --lockfile-only`           | PASS   | Workspace lockfile updated after quarantining `apps/web`; pnpm now reports 9 workspace projects.      |
| 2026-05-16 | `pnpm check:forbidden`                   | PASS   | Forbidden dependency scanner ignores `_cleanup_review` and active packages contain no forbidden deps. |
| 2026-05-16 | `pnpm check`                             | FAIL   | Initial run caught stale production-hardening test references to removed `apps/web/next.config.mjs`.  |
| 2026-05-16 | `pnpm check`                             | PASS   | Rerun passed after moving security-header assertions to Fastify API injection.                        |
| 2026-05-16 | `pnpm build:api`                         | PASS   | Fastify API TypeScript build passed.                                                                  |
| 2026-05-16 | `pnpm test:api`                          | PASS   | API route parity/security tests passed.                                                               |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`           | PASS   | Rerun with local DB access allowed; 19 files and 60 tests passed.                                     |
| 2026-05-16 | `docker build -f infra/Dockerfile.api .` | PASS   | API image built after removing the stale `apps/web/package.json` copy step.                           |

Phase 1 is complete. Remaining known contract gap: `/api/openapi.json` has route paths but still lacks reusable component schemas and full route-level schema metadata.

### Phase 2 - OpenAPI Contract Completion

| Time       | Command                        | Result | Notes                                                                                                   |
| ---------- | ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm test:api`                | FAIL   | First route schema pass changed validation behavior for login; fixed by preserving manual auth parsing. |
| 2026-05-16 | `pnpm test:api`                | FAIL   | OpenAPI schema test initially expected component keys; Fastify Swagger emits `def-*` keys with titles.  |
| 2026-05-16 | `pnpm test:api`                | PASS   | 7 API test files, 18 tests passed after schema and test fixes.                                          |
| 2026-05-16 | `pnpm check`                   | FAIL   | Initial run caught import-order/type-style lint issues and then Markdown formatting.                    |
| 2026-05-16 | `pnpm check`                   | PASS   | Typecheck, lint, format, non-DB tests, and forbidden dependency check passed.                           |
| 2026-05-16 | `pnpm build:api`               | PASS   | Fastify API TypeScript build passed.                                                                    |
| 2026-05-16 | `pnpm test:api`                | PASS   | API route and OpenAPI schema tests passed.                                                              |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | FAIL   | Sandbox blocked local PostgreSQL connections with `connect EPERM`.                                      |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | PASS   | Rerun with local DB access allowed; 20 files and 64 tests passed.                                       |

Phase 2 is complete. `/api/openapi.json` now has reusable component schemas, tags, summaries, route params, request bodies, success responses, and standard error responses covered by `apps/api/src/tests/openapi-schema.test.ts`.

### Phase 3 - Worker Runtime, Retry, And Dead Letter

| Time       | Command                        | Result | Notes                                                                                                             |
| ---------- | ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm test:workers`            | PASS   | Worker runtime tests covered success, retry, dead-letter, and distributed-lock requeue behavior.                  |
| 2026-05-16 | `pnpm check`                   | FAIL   | Initial run caught a queue retry test expectation that consumed the original job before the retry job.            |
| 2026-05-16 | `pnpm check`                   | PASS   | Typecheck, lint, format, non-DB tests, worker tests, and forbidden dependency check passed after test correction. |
| 2026-05-16 | `pnpm build:api`               | PASS   | Fastify API TypeScript build passed.                                                                              |
| 2026-05-16 | `pnpm test:api`                | PASS   | 8 API test files, 22 tests passed.                                                                                |
| 2026-05-16 | `pnpm test:workers`            | PASS   | Worker-specific test target passed.                                                                               |
| 2026-05-16 | `pnpm worker -- --help`        | FAIL   | Sandbox blocked `tsx` local IPC pipe creation.                                                                    |
| 2026-05-16 | `pnpm worker -- --help`        | PASS   | Rerun with local IPC access allowed; CLI help printed worker usage.                                               |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | FAIL   | Sandbox blocked local PostgreSQL connections with `connect EPERM`.                                                |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | PASS   | Rerun with local DB access allowed; 21 files and 70 tests passed.                                                 |

Phase 3 is complete. The worker runtime now has queue claim, Valkey lock protection, retry, dead-letter, idempotent enqueue, import job state hooks, export object verification, CLI scripts, and tests. Production worker container wiring remains Phase 7 packaging work.

### Phase 4 - Storage Hardening And Final Download Contract

| Time       | Command                        | Result | Notes                                                                                                          |
| ---------- | ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm db:generate`             | PASS   | Generated `packages/db/src/migrations/0006_sudden_sleepwalker.sql` for storage checksum and size metadata.     |
| 2026-05-16 | `pnpm build:api`               | FAIL   | Initial build caught missing typed asset error codes for new checksum/object download failures.                |
| 2026-05-16 | `pnpm build:api`               | PASS   | Fastify API TypeScript build passed after extending asset error codes.                                         |
| 2026-05-16 | `pnpm check`                   | FAIL   | First run caught formatting for touched source and generated Drizzle metadata.                                 |
| 2026-05-16 | `pnpm check`                   | PASS   | Typecheck, lint, format, non-DB tests, storage policy tests, API tests, and forbidden dependency check passed. |
| 2026-05-16 | `pnpm db:migrate`              | FAIL   | Sandbox blocked `tsx` local IPC pipe creation.                                                                 |
| 2026-05-16 | `pnpm db:migrate`              | PASS   | Rerun with local IPC/PostgreSQL access allowed; migration applied.                                             |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | PASS   | Rerun with local DB/MinIO access allowed; 22 files and 74 tests passed.                                        |
| 2026-05-16 | `pnpm build:api`               | PASS   | Final API build passed.                                                                                        |
| 2026-05-16 | `pnpm test:api`                | PASS   | 8 API test files, 22 tests passed.                                                                             |
| 2026-05-16 | `pnpm check`                   | PASS   | Final Phase 4 full check passed after Markdown formatting.                                                     |

Phase 4 is complete. File downloads are authorized streaming responses through Fastify; new attachment/export metadata stores `content_length` and `checksum_sha256`; downloads validate checksums; upload policies enforce MIME and size; and DB/MinIO-backed integration tests cover upload, download, delete, checksum, invalid MIME, oversized files, and export download.

### Phase 5 - Transactions, Idempotency, And Rate Limiting

| Time       | Command                        | Result | Notes                                                                                                           |
| ---------- | ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm build:api`               | PASS   | Fastify API TypeScript build passed after moving stock movement request parsing outside the transaction branch. |
| 2026-05-16 | `pnpm test:api`                | FAIL   | Initial sensitive-rate-limit route test leaked mock call history between tests; fixed with mock reset.          |
| 2026-05-16 | `pnpm test:api`                | PASS   | 9 API test files and 24 tests passed.                                                                           |
| 2026-05-16 | `pnpm check`                   | FAIL   | Initial run caught import-order/type-style lint issues and formatting in touched files.                         |
| 2026-05-16 | `pnpm check`                   | PASS   | Typecheck, lint, format, non-DB tests, API tests, and forbidden dependency check passed.                        |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | FAIL   | Sandbox blocked local PostgreSQL connections with `connect EPERM`.                                              |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test` | PASS   | Rerun with local DB access allowed; 23 files and 77 tests passed.                                               |

Phase 5 is complete. Stock movements, import previews, and export jobs now replay exact idempotent requests and reject changed payloads with `409 idempotency_conflict`; sensitive admin/upload/import/export mutations are protected by scoped Valkey-backed rate limits.

### Phase 6 - Observability And Prometheus Cleanup

| Time       | Command                                             | Result | Notes                                                                                    |
| ---------- | --------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| 2026-05-16 | `pnpm build:api`                                    | PASS   | Fastify API TypeScript build passed after metrics helper and plugin wiring.              |
| 2026-05-16 | `pnpm test:api`                                     | PASS   | 9 API test files and 24 tests passed; metrics route asserts expected metric names.       |
| 2026-05-16 | `pnpm check`                                        | FAIL   | Initial run caught `require-await` hook lint issues, then formatting in touched files.   |
| 2026-05-16 | `pnpm check`                                        | PASS   | Typecheck, lint, format, non-DB tests, API tests, and forbidden dependency check passed. |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                      | FAIL   | Sandbox blocked local PostgreSQL connections with `connect EPERM`.                       |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                      | PASS   | Rerun with local DB access allowed; 23 files and 77 tests passed.                        |
| 2026-05-16 | `pnpm docker:dev`                                   | FAIL   | Sandbox blocked Docker daemon socket access.                                             |
| 2026-05-16 | `pnpm docker:dev`                                   | PASS   | Rerun with Docker daemon access allowed; dev services started.                           |
| 2026-05-16 | `docker compose -f infra/docker-compose.dev.yml ps` | PASS   | PostgreSQL, Valkey, MinIO, Mailpit, OTel collector, Prometheus, and Grafana are running. |

Phase 6 is complete. Prometheus targets now reference the Fastify API, `/api/metrics` exposes request and domain metrics, and observability docs list metric names, labels, alert recommendations, and triage steps.

### Phase 7 - Production/On-Prem Release Packaging

| Time       | Command                                                                                                     | Result | Notes                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| 2026-05-16 | `bash -n scripts/validate-prod-compose.sh`                                                                  | PASS   | Production Compose validation helper shell syntax is valid.                                                          |
| 2026-05-16 | `bash -n scripts/smoke-api.sh`                                                                              | PASS   | API smoke helper shell syntax is valid.                                                                              |
| 2026-05-16 | `bash -n scripts/export-release-images.sh`                                                                  | PASS   | Release image export helper shell syntax is valid after backend-only image updates.                                  |
| 2026-05-16 | `pnpm build:api`                                                                                            | PASS   | Fastify API TypeScript build passed.                                                                                 |
| 2026-05-16 | `pnpm test:api`                                                                                             | PASS   | 9 API test files and 24 tests passed.                                                                                |
| 2026-05-16 | `pnpm check`                                                                                                | PASS   | Typecheck, lint, format, non-DB tests, API tests, and forbidden dependency check passed.                             |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                                                                              | FAIL   | Sandbox blocked local PostgreSQL connections with `connect EPERM`.                                                   |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                                                                              | PASS   | Rerun with local DB access allowed; 23 files and 77 tests passed.                                                    |
| 2026-05-16 | `docker compose --env-file infra/env.production.validation.example -f infra/docker-compose.prod.yml config` | PASS   | Production Compose renders API, worker, Postgres, Valkey, MinIO, MinIO init, Prometheus, Grafana, and OTel services. |
| 2026-05-16 | `docker build -f infra/Dockerfile.api .`                                                                    | PASS   | Backend-only API image built without `apps/web` references.                                                          |
| 2026-05-16 | `pnpm docker:prod:config`                                                                                   | PASS   | Scripted production Compose validation passed.                                                                       |

Phase 7 is complete. Production packaging is backend-only, includes a worker process, has a validation env file, and has documented release, backup, offline bundle, smoke-test, and rollback paths.

### Phase 8 - Frontend Real Data-Flow Readiness

| Time       | Command                                                           | Result | Notes                                                                                                  |
| ---------- | ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| 2026-05-16 | `pnpm db:seed:uat`                                                | FAIL   | Sandbox blocked `tsx` local IPC pipe creation.                                                         |
| 2026-05-16 | `pnpm db:seed:uat`                                                | PASS   | Rerun with local IPC/PostgreSQL access allowed; UAT seed completed.                                    |
| 2026-05-16 | `pnpm db:seed:uat`                                                | PASS   | Second UAT seed run passed with local IPC/PostgreSQL access allowed.                                   |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test tests/integration/uat-seed.test.ts` | FAIL   | Initial test imported `drizzle-orm` directly from root test context; fixed to consume DB package APIs. |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test tests/integration/uat-seed.test.ts` | PASS   | 1 file and 3 UAT seed tests passed with local DB access.                                               |
| 2026-05-16 | `pnpm check`                                                      | FAIL   | Initial run caught Markdown formatting in touched docs.                                                |
| 2026-05-16 | `pnpm check`                                                      | PASS   | Typecheck, lint, format, non-DB tests, API tests, and forbidden dependency check passed.               |
| 2026-05-16 | `pnpm build:api`                                                  | PASS   | Fastify API TypeScript build passed.                                                                   |
| 2026-05-16 | `pnpm test:api`                                                   | PASS   | 9 API test files and 24 tests passed.                                                                  |
| 2026-05-16 | `pnpm db:seed`                                                    | PASS   | Base seed completed with local IPC/PostgreSQL access allowed.                                          |
| 2026-05-16 | `pnpm db:seed:uat`                                                | PASS   | UAT seed completed after docs/examples updates.                                                        |
| 2026-05-16 | `pnpm db:seed:uat`                                                | PASS   | Second UAT seed idempotency run completed after docs/examples updates.                                 |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                                    | PASS   | Full DB-enabled test suite passed: 24 files and 80 tests.                                              |

Phase 8 is complete. Local-only UAT seed data now covers users, roles, organization, departments, location hierarchy, catalog, assets, stock, custody, transfer, maintenance, audit, import, and export metadata. Frontend examples and a simple `.http` smoke collection are available.

### Phase 9 - Final Cleanup And Release Hygiene

| Time       | Command                                                                                                     | Result | Notes                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| 2026-05-16 | `pnpm install`                                                                                              | PASS   | Workspace install passed; pnpm removed stale installed packages from no-longer-active workspace manifests.   |
| 2026-05-16 | `pnpm check:forbidden`                                                                                      | PASS   | No forbidden dependencies found in active manifests.                                                         |
| 2026-05-16 | `pnpm check`                                                                                                | PASS   | Typecheck, lint, format, non-DB tests, API tests, and forbidden dependency check passed.                     |
| 2026-05-16 | `pnpm build:api`                                                                                            | PASS   | Fastify API TypeScript build passed.                                                                         |
| 2026-05-16 | `pnpm test:api`                                                                                             | PASS   | 9 API test files and 24 tests passed.                                                                        |
| 2026-05-16 | `env RUN_DB_TESTS=1 pnpm test`                                                                              | PASS   | Full DB-enabled suite passed with local DB access allowed: 24 files and 80 tests.                            |
| 2026-05-16 | `pnpm db:generate`                                                                                          | PASS   | Drizzle saw 47 tables and no schema changes.                                                                 |
| 2026-05-16 | `pnpm db:migrate`                                                                                           | PASS   | Migrations applied cleanly with local IPC/PostgreSQL access allowed.                                         |
| 2026-05-16 | `pnpm db:seed`                                                                                              | PASS   | Base seed completed with local IPC/PostgreSQL access allowed.                                                |
| 2026-05-16 | `pnpm db:seed`                                                                                              | PASS   | Second base seed idempotency run completed.                                                                  |
| 2026-05-16 | `pnpm db:seed:uat`                                                                                          | PASS   | UAT seed completed with local IPC/PostgreSQL access allowed.                                                 |
| 2026-05-16 | `pnpm db:seed:uat`                                                                                          | PASS   | Second UAT seed idempotency run completed.                                                                   |
| 2026-05-16 | `docker build -f infra/Dockerfile.api .`                                                                    | PASS   | Backend-only API image built successfully.                                                                   |
| 2026-05-16 | `docker compose --env-file infra/env.production.validation.example -f infra/docker-compose.prod.yml config` | PASS   | Production Compose rendered API, worker, Postgres, Valkey, MinIO, MinIO init, Prometheus, Grafana, and OTel. |

Phase 9 is complete. No new files were deleted during final cleanup; `apps/web` remains quarantined under `_cleanup_review/backend-completion/apps-web-legacy`, and `docs/engineering/DOCS_INDEX.md` identifies current docs for handoff.

### Phase 10 - Final Readiness Audit And Endpoint Smoke

| Time       | Command                                                       | Result | Notes                                                                                    |
| ---------- | ------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| 2026-05-16 | `docker compose -f infra/docker-compose.dev.yml ps`           | PASS   | PostgreSQL, Valkey, MinIO, Mailpit, OTel collector, Prometheus, and Grafana are running. |
| 2026-05-16 | `pnpm dev`                                                    | FAIL   | Default port `3000` was already occupied by an unrelated local `next-server` process.    |
| 2026-05-16 | `API_PORT=3002 APP_BASE_URL=http://localhost:3002 pnpm start` | PASS   | Temporary Fastify API started for endpoint smoke checks.                                 |
| 2026-05-16 | Initial unelevated localhost curl checks                      | FAIL   | Sandbox blocked localhost access; rerun with local network access allowed passed.        |
| 2026-05-16 | `GET /api/health/live`                                        | PASS   | Returned HTTP 200.                                                                       |
| 2026-05-16 | `GET /api/health/ready`                                       | PASS   | Returned HTTP 200 with PostgreSQL, Valkey, and MinIO ready.                              |
| 2026-05-16 | `GET /api/metrics`                                            | PASS   | Returned HTTP 200 and expected API/file metric names.                                    |
| 2026-05-16 | `GET /api/ops/status`                                         | PASS   | Returned HTTP 200.                                                                       |
| 2026-05-16 | `GET /api/openapi.json`                                       | PASS   | Returned HTTP 200; smoke inspection found 44 paths and 10 component schemas.             |
| 2026-05-16 | `GET /api/docs`                                               | PASS   | Returned HTTP 200.                                                                       |
| 2026-05-16 | `GET /api/auth/me` without session                            | PASS   | Returned expected HTTP 401.                                                              |
| 2026-05-16 | `POST /api/auth/login` with UAT admin                         | PASS   | Returned HTTP 200 and set the session cookie.                                            |
| 2026-05-16 | `GET /api/auth/me` with session                               | PASS   | Returned HTTP 200.                                                                       |
| 2026-05-16 | `GET /api/assets?q=UAT-LAP-001` with session                  | PASS   | Returned HTTP 200 and seeded UAT asset data.                                             |
| 2026-05-16 | OpenAPI/metrics smoke inspection                              | PASS   | Found 44 OpenAPI paths, 10 component schemas, request metrics, and file metrics.         |
| 2026-05-16 | `pnpm exec prettier --write ...`                              | PASS   | Formatted the final audit and updated completion docs.                                   |
| 2026-05-16 | `pnpm format:check`                                           | PASS   | All matched files use Prettier style.                                                    |
| 2026-05-16 | `pnpm check`                                                  | PASS   | Final post-audit typecheck, lint, format, non-DB tests, and forbidden dependency passed. |

Phase 10 smoke verification is complete. The final audit is written to `docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT_AFTER_COMPLETION.md`.
