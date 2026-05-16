# Codex Prompt — Continuous Phase-by-Phase Implementation Loop

You are working inside:

```text
enterprise-inventory-platform/
```

## Goal

Implement the full enterprise inventory product quickly but safely, phase by phase, using the roadmap and testing gates.

You must continue through the roadmap until all phases are complete, unless you hit a true blocker that prevents safe implementation.

## Required reading before every run

Read:

```text
AGENTS.md
docs/engineering/MASTER_PRODUCT_ROADMAP.md
docs/engineering/TESTING_GATES.md
docs/engineering/PRODUCT_MANAGER_UAT_CHECKLIST.md
docs/engineering/FEATURE_IMPLEMENTATION_WORKFLOW.md
docs/engineering/PROJECT_PROGRESS.md
```

If a file is missing, create it from the project requirements before continuing.

## Hard constraints

Do not add:

- Prisma
- Supabase runtime
- Firebase
- MongoDB
- Neon/serverless-only runtime
- paid SaaS core dependencies
- direct DB access from UI/client components
- direct MinIO/Valkey access from UI/client components
- tenant-unscoped queries for tenant-owned data
- mutation without validation
- protected mutation without permission check
- important mutation without audit log
- feature without tests
- feature without product/UAT checklist

## Operating loop

Repeat this loop:

### 1. Select next task

Open:

```text
docs/engineering/PROJECT_PROGRESS.md
docs/engineering/MASTER_PRODUCT_ROADMAP.md
```

Find the first incomplete phase and the first incomplete task.

### 2. Create task note

Create or update:

```text
docs/engineering/features/<phase-number>-<feature-name>.md
```

Use the template from:

```text
docs/engineering/PHASE_COMPLETION_TEMPLATE.md
```

Include:

- requirement
- scope
- out of scope
- affected folders
- DB changes
- API/server actions
- UI changes
- permission rules
- audit log rules
- tests
- product manager UAT checklist
- rollback/migration notes

### 3. Implement in correct order

Implement in this order:

1. DB schema/migration if needed.
2. Repository.
3. Validation schema.
4. Core service.
5. Permission check.
6. Audit log.
7. Server action/route handler.
8. UI.
9. Unit tests.
10. Integration tests.
11. E2E/product flow tests if UI changed.
12. Documentation.
13. QA checklist update.

### 4. Run testing gates

Run the required commands from:

```text
docs/engineering/TESTING_GATES.md
```

Minimum for every task:

```bash
pnpm check
pnpm build
RUN_DB_TESTS=1 pnpm test
```

If DB changed:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

If UI changed and E2E is available:

```bash
pnpm test:e2e
```

If E2E is not yet available, create or update the planned E2E test and write a manual QA checklist.

### 5. Fix failures before moving on

If tests fail:

- diagnose
- fix
- rerun
- do not continue to the next feature until fixed

### 6. Product manager UAT check

For every completed feature, write a short PM/UAT result in the feature note:

- Can a non-technical user understand the screen?
- Is empty state clear?
- Is error state clear?
- Is success feedback clear?
- Are labels business-friendly?
- Is the workflow complete end-to-end?
- Is the feature useful for real inventory operations?

### 7. Update progress

Update:

```text
docs/engineering/PROJECT_PROGRESS.md
```

Mark:

- task status
- files changed
- migrations created
- tests run
- QA/UAT status
- known gaps
- next task

### 8. Continue

Move to the next task.

## Stop only for true blockers

Stop only if:

- a required business rule is impossible to infer safely
- a security decision is required
- a destructive migration is needed
- a license issue appears
- a required command cannot run after reasonable fixes
- implementation would violate AGENTS.md

If blocked, write:

```text
docs/engineering/BLOCKERS.md
```

Include exact blocker and safe options.

## Final completion definition

The product is complete only when:

- all phases in `MASTER_PRODUCT_ROADMAP.md` are complete
- all tests pass
- all migrations apply cleanly
- seed is idempotent
- health checks pass
- no forbidden dependency exists
- PM/UAT checklist is complete
- QA checklist is complete
- release docs exist
- admin guide exists
- user guide exists
- deployment/backup/restore docs exist

## Final response format after each Codex run

Always report:

1. Phase/task completed.
2. Files changed.
3. Commands run.
4. Tests passed/failed.
5. QA/UAT result.
6. Known gaps.
7. Next task started or recommended.
