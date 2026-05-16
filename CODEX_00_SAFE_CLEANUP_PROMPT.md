# Codex Prompt — Safe Cleanup Before Further Development

You are working inside:

```text
enterprise-inventory-platform/
```

## Goal

Clean the Phase 1 scaffold before continuing development.

Remove unused, duplicate, accidental, generated, or misplaced files **safely**. Do not delete useful governance docs, source code, infra config, migrations, tests, or package files.

## Hard rules

- Do not delete files blindly.
- Do not remove files only because they are not currently imported if they are intentionally part of docs, infra, migrations, templates, or generated config.
- Do not remove `AGENTS.md`.
- Do not remove engineering docs.
- Do not remove Drizzle migrations.
- Do not remove Docker/Prometheus/Grafana/OTel/MinIO config.
- Do not remove tests unless proven duplicate/unused and documented.
- Do not add forbidden dependencies.
- Do not add Prisma, Supabase, Firebase, MongoDB, Neon serverless runtime, or paid SaaS dependency.

## Step 1 — Read governance

Read these files first:

```text
AGENTS.md
docs/engineering/FOLDER_AND_BOUNDARY_RULES.md
docs/engineering/DB_DRIZZLE_RULES.md
docs/engineering/BACKEND_API_RULES.md
docs/engineering/ESLINT_AND_CODE_QUALITY.md
docs/engineering/FEATURE_IMPLEMENTATION_WORKFLOW.md
```

## Step 2 — Establish baseline

Run:

```bash
git status --short || true
pnpm check
pnpm build
RUN_DB_TESTS=1 pnpm test
```

If any command already fails, document the failure before cleanup.

## Step 3 — Create cleanup report

Create:

```text
docs/engineering/cleanup/PHASE_1_CLEANUP_REPORT.md
```

Include:

- current project structure summary
- files reviewed
- files kept and why
- files moved/removed and why
- commands run before cleanup
- commands run after cleanup
- risk notes

## Step 4 — Detect cleanup candidates

Look for:

- `__MACOSX`
- `.DS_Store`
- duplicate generated files
- empty placeholder files with no future purpose
- accidental files copied from audit/research folders into the product repo
- unused temporary scripts
- duplicate config files
- duplicate docs with same content
- broken backup files
- local logs
- `.tmp`, `.bak`, `.old`, `.orig`
- `repo-audit` folder accidentally copied inside product repo
- cloned reference repositories accidentally copied inside product repo

Do not treat these as unused:

- migrations
- seed files
- config files
- docs
- test fixtures
- Docker/infra config
- package manifests
- workspace files
- lint/type/test config
- template docs used by future phases

## Step 5 — Verify references

For every file that seems removable:

1. Search for references:
   ```bash
   rg "<filename-or-export-name>" .
   ```
2. Check imports.
3. Check package scripts.
4. Check Docker Compose references.
5. Check docs references.
6. Check tests references.

## Step 6 — Quarantine risky files first

Create:

```text
_cleanup_review/phase-1/
```

Move uncertain files there instead of deleting:

```bash
mkdir -p _cleanup_review/phase-1
```

Only permanently delete obvious OS metadata and generated junk.

## Step 7 — Run verification after cleanup

Run:

```bash
pnpm check
pnpm build
pnpm db:migrate
pnpm db:seed
RUN_DB_TESTS=1 pnpm test
```

Also verify health routes if Docker/dev services are running:

```bash
pnpm docker:dev
pnpm dev
```

Then check:

```text
/api/health/live
/api/health/ready
/api/metrics
```

## Step 8 — If cleanup breaks anything

Restore the moved file from `_cleanup_review/phase-1/`, fix the issue, and document the reason.

## Step 9 — Final response

Report:

1. Files removed.
2. Files moved to `_cleanup_review/phase-1/`.
3. Files intentionally kept.
4. Commands run.
5. Tests passed/failed.
6. Any remaining cleanup risks.
7. Whether Phase 2 can safely begin.
