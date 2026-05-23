# Testing Gates

## Minimum Gate For Every Task

```bash
pnpm check
pnpm build
RUN_DB_TESTS=1 pnpm test
```

## Database Change Gate

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
RUN_DB_TESTS=1 pnpm test
```

## Infrastructure Change Gate

```bash
pnpm docker:dev
pnpm check
```

## UI Change Gate

Run the minimum gate. If E2E exists for the touched workflow, also run:

```bash
pnpm test:e2e
```

If E2E does not exist yet, add or update the planned e2e/manual QA checklist in the feature note.

## Release Readiness Gate

Before any phase is marked complete:

- Typecheck passes.
- Lint passes.
- Format check passes.
- Unit and integration tests pass.
- Forbidden dependency check passes.
- Migrations apply cleanly.
- Seed is idempotent.
- Health checks pass when local dependencies are running.
- PM/UAT checklist is updated.
