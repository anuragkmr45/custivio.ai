# Phase/Feature Completion Template

Create one file per feature or task:

```text
docs/engineering/features/<phase-number>-<feature-name>.md
```

## Requirement

Describe the business requirement.

## Scope

What will be implemented.

## Out of scope

What will not be implemented now.

## Affected folders

```text
apps/web/...
packages/db/...
packages/core/...
packages/auth/...
packages/storage/...
packages/cache/...
packages/config/...
packages/telemetry/...
tests/...
docs/...
```

## DB changes

- Tables:
- Columns:
- Indexes:
- Constraints:
- Migration file:
- Rollback notes:

## API/server actions

- Route/action:
- Input validation:
- Permission:
- Tenant check:
- Audit log:

## UI changes

- Screens:
- Components:
- Empty state:
- Loading state:
- Error state:
- Success state:

## Tests

### Unit

- [ ] Test name

### Integration

- [ ] Test name

### E2E/manual

- [ ] Test name

## Product Manager UAT

- [ ] Happy path is clear.
- [ ] Error path is clear.
- [ ] User gets useful feedback.
- [ ] Workflow matches inventory business need.
- [ ] Feature is demo-ready.

## Commands run

```bash
pnpm check
pnpm build
RUN_DB_TESTS=1 pnpm test
```

## Results

- Typecheck:
- Lint:
- Build:
- Unit:
- Integration:
- E2E:
- Manual QA:
- PM/UAT:

## Known gaps

-

## Completion status

- [ ] Complete
- [ ] Blocked
- [ ] Needs review
