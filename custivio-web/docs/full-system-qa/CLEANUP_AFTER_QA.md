# Cleanup After QA

Report date: 2026-05-17

## Scope

This cleanup removed generated or scratch files left by browser testing and local builds. It did not remove source code, migration files, lockfiles, environment files, QA evidence, archived integration docs, or backend quarantine files that are still referenced by handoff documentation.

## Deleted

| Path                                                                             | Reason                                                                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/Users/anuragkumar/Desktop/inventory-research/.DS_Store`                        | macOS Finder metadata; not product source.                                                          |
| `/Users/anuragkumar/Desktop/inventory-research/.playwright-mcp/`                 | Playwright MCP console/page captures from local manual QA; evidence has been summarized in QA docs. |
| `/Users/anuragkumar/Desktop/inventory-research/console-after-routes.md`          | Scratch console capture; not referenced by source or docs.                                          |
| `/Users/anuragkumar/Desktop/inventory-research/console-login.md`                 | Scratch console capture; not referenced by source or docs.                                          |
| `/Users/anuragkumar/Desktop/inventory-research/console-login2.md`                | Scratch console capture; not referenced by source or docs.                                          |
| `/Users/anuragkumar/Desktop/inventory-research/custivio-web/dist/`               | Generated frontend build output; can be recreated with `npm run build`.                             |
| `/Users/anuragkumar/Desktop/inventory-research/custivio-web/node_modules/.vite/` | Generated Vite dependency cache.                                                                    |
| `/Users/anuragkumar/Desktop/inventory-research/custivio/node_modules/.vite/`     | Generated Vite/Vitest dependency cache.                                                             |

## Kept

| Path                                                            | Reason                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `custivio-web/docs/full-system-qa/`                             | Required QA evidence and final readiness audit.                                           |
| `custivio-web/docs/api-integration-archive/`                    | Historical integration archive from UI revamp; kept for traceability.                     |
| `custivio-web/package-lock.json`                                | Current frontend uses npm commands and this lockfile captures installed dependency state. |
| `custivio-web/scripts/fix-preview-entry.mjs`                    | Required for `npm run preview` after build.                                               |
| `custivio/_cleanup_review/`                                     | Backend handoff docs still reference this as quarantine/rollback evidence.                |
| `/private/tmp/eip-qa-compose.yml` and `/private/tmp/eip-qa.env` | Local QA runbook references these files for replaying the Docker QA environment.          |

## Verification

| Check                                                                                                              | Result                   |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Workspace scan for `.DS_Store`, `__MACOSX`, `*.tmp`, `*.bak`, and `console-*.md` at depth 2                        | PASS, no matches remain. |
| Frontend generated output scan for `dist`, `coverage`, `.vite`, `test-results`, and `playwright-report` at depth 2 | PASS, no matches remain. |
| Backend generated output scan for `dist`, `coverage`, `.vite`, `test-results`, and `playwright-report` at depth 2  | PASS, no matches remain. |
