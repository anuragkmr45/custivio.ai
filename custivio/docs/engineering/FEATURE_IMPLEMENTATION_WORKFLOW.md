# Feature Implementation Workflow

Before coding:

1. Identify the product module.
2. Identify affected folders and packages.
3. Identify database tables and migrations.
4. Identify API handlers or server actions.
5. Identify UI screens and components.
6. Identify tests.
7. Identify manual QA steps.
8. Identify migration and compatibility risks.
9. Confirm no forbidden dependency is needed.
10. Create or update a feature note.

Feature notes live in:

```text
docs/engineering/features/<feature-name>.md
```

Required sections:

- Requirement
- Scope
- Out of scope
- Affected folders
- DB changes
- API/server actions
- UI screens
- Permission rules
- Audit log rules
- Tests
- Manual QA checklist
- Rollback/migration notes
