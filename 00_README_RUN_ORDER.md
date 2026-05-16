# Inventory Platform — Codex Execution Pack

Use this pack after Phase 1 scaffold is complete.

## Run order

### Step 1 — Safe cleanup first

Paste this prompt into Codex:

```text
Read CODEX_00_SAFE_CLEANUP_PROMPT.md and execute it exactly.
```

This will remove or quarantine unused files safely without breaking the project.

### Step 2 — Add the master roadmap files to the project

Ask Codex to copy these files into the project:

```text
docs/engineering/MASTER_PRODUCT_ROADMAP.md
docs/engineering/TESTING_GATES.md
docs/engineering/PRODUCT_MANAGER_UAT_CHECKLIST.md
docs/engineering/PROJECT_PROGRESS.md
docs/engineering/PHASE_COMPLETION_TEMPLATE.md
```

### Step 3 — Run the continuous implementation loop

Paste this prompt into Codex:

```text
Read CODEX_01_MASTER_CONTINUOUS_IMPLEMENTATION_PROMPT.md and execute it phase by phase. Do not skip tests. Continue until all phases in docs/engineering/MASTER_PRODUCT_ROADMAP.md are complete, or stop only if a true blocker prevents safe implementation.
```

## Important

Codex must not randomly implement everything in one messy pass.

It must work like this:

1. Pick next incomplete phase.
2. Pick next incomplete task.
3. Create/update feature note.
4. Implement.
5. Run unit/integration/e2e/QA gates.
6. Fix failures.
7. Update progress.
8. Move to next task.

## Required project rule

Every feature must have:

- code
- validation
- DB migration if needed
- permission check if protected
- audit log if mutation
- tests
- product manager UAT checklist
- good user experience review
