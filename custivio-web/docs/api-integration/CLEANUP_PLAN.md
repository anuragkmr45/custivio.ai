# Cleanup Plan After Revamp

Report date: 2026-05-17

## Rules

1. Do not delete revamped UI components blindly.
2. Search references before removing anything.
3. Archive uncertain files under `_cleanup_review/api-integration-revamp/`.
4. Delete only obvious junk after confirmation.
5. Keep tests unless replaced by stronger tests.

## Current Cleanup Candidates

| Path                                                  | Classification       | Reason                                                                 | Action                               |
| ----------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| `src/lib/mock/data.ts`                                | QUARANTINE_CANDIDATE | Large mock fixture from old UI; current routes use API services        | Reference-check before moving        |
| `src/lib/role.ts`                                     | QUARANTINE_CANDIDATE | localStorage role helper from old UI; backend permissions now used     | Reference-check before moving        |
| `package-lock.json`                                   | REVIEW               | Created by npm install and currently untracked; `bun.lock` also exists | Choose package manager before commit |
| `docs/api-integration-archive/20260517-revamp-reset/` | KEEP                 | Historical pre-revamp integration docs                                 | Keep for audit trail                 |
| UI primitive fast-refresh lint warnings               | KEEP_WITH_NOTES      | Existing shadcn style exports trigger warnings but lint passes         | Optional future cleanup              |

## Cleanup Gate

After any cleanup, run:

```text
npm run typecheck
npm run test
npm run lint
npm run build
npm run test:e2e
```

Do not mark cleanup complete if any gate fails.
