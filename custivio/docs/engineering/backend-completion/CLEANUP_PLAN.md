# Cleanup Plan

## Purpose

Safely remove or quarantine files that are no longer useful for the backend-only Fastify repo without deleting migrations, source code, tests, infrastructure, package manifests, or required governance docs blindly.

## Cleanup Folder

Risky files will be moved to:

```text
_cleanup_review/backend-completion/
```

## Classification Rules

| Classification | Meaning                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| KEEP_CURRENT   | Active source, tests, package files, infra, migrations, or current docs.                   |
| KEEP_REFERENCE | Historical docs still useful for traceability.                                             |
| ARCHIVE        | Historical docs that should remain in docs but marked as superseded.                       |
| QUARANTINE     | Risky or obsolete files moved to `_cleanup_review/backend-completion/` before deletion.    |
| DELETE         | Clearly useless generated/OS junk such as `.DS_Store`, `__MACOSX`, `.tmp`, `.bak`, `.old`. |

## Never Delete Without Explicit Evidence

- `AGENTS.md`
- `README.md`
- `docs/engineering/API_CONTRACT.md`
- `docs/engineering/FRONTEND_HANDOFF.md`
- `docs/engineering/BACKEND_DB_INFRA_FINAL_READINESS_AUDIT.md`
- `docs/engineering/backend-completion/*`
- `docs/engineering/DB_DRIZZLE_RULES.md`
- `docs/engineering/BACKEND_API_RULES.md`
- `docs/engineering/TESTING_GATES.md`
- `docs/operations/**`
- Drizzle migrations and snapshots
- Tests
- Package manifests and lockfiles
- Docker, Prometheus, Grafana, OTel, and MinIO config

## Initial Candidate Classes

| Candidate class                     | Classification           | Notes                                                            |
| ----------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `.DS_Store`                         | DELETE                   | OS metadata only after confirming path.                          |
| `__MACOSX`                          | DELETE                   | Archive metadata only.                                           |
| `*.tmp`, `*.bak`, `*.old`, `*.orig` | DELETE or QUARANTINE     | Delete only if clearly generated; otherwise quarantine.          |
| `apps/web`                          | QUARANTINE candidate     | Only after API parity and backend-only docs/scripts are updated. |
| Old backend migration planning docs | KEEP_REFERENCE initially | May be archived after final docs index is created.               |
| Superseded readiness reports        | KEEP_REFERENCE initially | Latest and post-completion audits must remain.                   |

## Reference Check Procedure

For every candidate:

```bash
rg "<filename-or-important-title>" .
```

Also check package scripts, Dockerfile/Compose, docs, and tests before moving or deleting.

## Cleanup Manifest

Final cleanup results will be recorded in:

```text
docs/engineering/backend-completion/CLEANUP_MANIFEST.md
```
