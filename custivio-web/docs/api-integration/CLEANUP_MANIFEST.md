# Custivio Cleanup Manifest

Report date: 2026-05-22

| Path                                                  | Classification  | Status              | Notes                                                                                                            |
| ----------------------------------------------------- | --------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/lib/mock/data.ts`                                | DELETE          | COMPLETE            | `rg` found no active imports; file contained stale mock product data.                                            |
| `src/lib/role.ts`                                     | DELETE          | COMPLETE            | `rg` found no active imports; file used localStorage role switching superseded by backend session permissions.   |
| `src/routes/__root.tsx`                               | UPDATE          | COMPLETE            | Metadata updated to Custivio and stale Lovable preview/social image references removed.                          |
| `wrangler.jsonc`                                      | UPDATE          | COMPLETE            | Worker name updated to `custivio-web`.                                                                           |
| `docs/api-integration-archive/20260517-revamp-reset/` | KEEP            | COMPLETE_WITH_NOTES | Historical archive retained; not active runtime code.                                                            |
| `.lovable/`                                           | ALREADY_REMOVED | COMPLETE_WITH_NOTES | Previously deleted and not restored.                                                                             |
| `dist/`                                               | GENERATED       | COMPLETE_WITH_NOTES | Recreated by `npm run build`; do not treat as source.                                                            |
| `package-lock.json`                                   | KEEP            | COMPLETE            | npm remains the frontend package manager for this run.                                                           |
| UI primitive fast-refresh warnings                    | REPLACE         | COMPLETE            | Moved button/toggle variants to separate files and removed unused hook/helper exports.                           |
| Asset registry export/scan dead buttons               | REPLACE         | COMPLETE            | Buttons now navigate to the API-backed Audit & Reports workflows.                                                |
| Login dead forgot-password link                       | DELETE          | COMPLETE            | Removed unsupported `href="#"` action.                                                                           |
| Frontend npm audit moderate findings                  | UPDATE          | COMPLETE            | `npm audit fix` applied semver-compatible updates; `npm audit --audit-level=moderate` reports 0 vulnerabilities. |

## Reference Checks

- `rg "src/lib/mock|lib/mock|mock/data|from .*role|lib/role"` found no active imports before deletion.
- Frontend `npm run lint`, `npm run typecheck`, and `npm run test` passed after cleanup.

## Remaining Cleanup Risks

- Historical docs still mention old project names by design.
- Full browser-click UAT passed for the core asset/admin-denial flow; broader browser mutation coverage across every module remains a P2 expansion.
