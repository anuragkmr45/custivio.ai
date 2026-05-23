# Cleanup Plan

## Rules

- Do not delete UI components, tests, package files, or route files blindly.
- Search references with `rg` before removing any mock/demo file.
- Move uncertain files to `_cleanup_review/api-integration/`.
- Delete only obvious generated junk such as `.DS_Store`, `__MACOSX`, `*.tmp`, `*.bak`, and duplicate stale prompts.

## Initial Classification

| Path                              | Classification   | Reason                                        | Action                                                                        |
| --------------------------------- | ---------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/mock/data.ts`            | REPLACE_WITH_API | Current source for all business fixture data. | Keep until every route has API-backed replacement, then quarantine or delete. |
| `src/lib/auth.ts`                 | REPLACE_WITH_API | Uses localStorage mock auth.                  | Replace with backend session helpers.                                         |
| `src/routes/_authenticated/*.tsx` | KEEP             | Real UI route surfaces.                       | Refactor data loading only.                                                   |
| `src/components/ui/**`            | KEEP             | UI primitives used by routes.                 | Do not delete.                                                                |
| `src/components/data/**`          | KEEP             | Reusable tables/panels/status components.     | Extend only if API states require it.                                         |
| `.env`                            | KEEP_LOCAL       | Local developer env, untracked.               | Do not print or commit.                                                       |

## Cleanup Manifest

Create `CLEANUP_MANIFEST.md` during Phase 12 after API integration is proven.
