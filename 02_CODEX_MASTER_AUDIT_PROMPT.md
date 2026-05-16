# Codex Master Prompt — Repo Audit and Extraction

Use this prompt after placing all shortlisted repos in one parent folder.

---

## Role

You are a senior enterprise software architect, TypeScript/Next.js engineer, PostgreSQL/Drizzle expert, and QA lead. You are auditing multiple open-source repositories to design a new enterprise-grade on-prem inventory and IT asset management platform.

## Hard requirements for the final project

The final project must use:

- React / Next.js with TypeScript
- Drizzle ORM only
- PostgreSQL only
- Valkey for cache/queues/locks/rate limits
- MinIO for file/object storage
- Docker Compose for all local/dev dependencies
- On-prem and air-gapped deployment readiness
- No Prisma in the final project
- No Firebase
- No MongoDB
- No Supabase dependency in final production runtime
- No Neon/serverless dependency in final production runtime
- No paid SaaS dependency for core operations
- No direct AGPL/Elastic-licensed code copying unless explicitly approved
- Clean code, tests, validation, RBAC, audit logs and production-grade error handling

## Input folder

Assume the parent folder contains cloned repositories:

```text
inventory-research/
  FinOpenPOS/
  dashboard-boilerplate/
  QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind/
  filadex/
  ce/
  SAMS/
  Sanchay/
  Roomer/
  PartPilot/
  panthora/
  chittyassets/
```

If a repo is missing, skip it and mention it in the final audit report. Do not hallucinate files or code.

## Main task

Read every repo carefully. Create a complete audit report and extraction plan for building a fresh new project named:

```text
enterprise-inventory-platform
```

Do not directly merge code. First analyze.

## Step-by-step process

### Step 1 — Inventory the repos

For each repo:

1. Identify:
   - framework
   - frontend stack
   - backend stack
   - database
   - ORM
   - auth
   - storage
   - Docker support
   - tests
   - license
   - maturity level
   - risks

2. Create:
   - `repo-audit/<repo-name>/SUMMARY.md`
   - `repo-audit/<repo-name>/ARCHITECTURE.md`
   - `repo-audit/<repo-name>/DATA_MODEL.md`
   - `repo-audit/<repo-name>/FEATURES.md`
   - `repo-audit/<repo-name>/RISKS.md`

3. Do not assume anything not present in files. Quote file paths and code references.

### Step 2 — Score each repo

Score every repo from 0 to 5 in each category:

- Stack match with target requirements
- On-prem/air-gap readiness
- Inventory/asset-management domain fit
- Database/schema quality
- UI quality
- Auth/RBAC quality
- File/storage handling
- Import/export handling
- Reporting/dashboard quality
- Testing maturity
- Maintainability
- License suitability
- Security posture

Create:

```text
repo-audit/REPO_SCORECARD.md
```

Use this table:

| Repo | Stack match | Domain fit | DB/schema | Auth/RBAC | Storage | Docker | Tests | License risk | Security risk | Keep/Reject/Reference | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|

### Step 3 — Extract reusable ideas

Create:

```text
repo-audit/REUSABLE_IDEAS.md
```

Group ideas under:

- Architecture
- UI/UX
- Asset data model
- Inventory/stock model
- QR/barcode flows
- Custody/movement
- Maintenance
- Audit/compliance
- Import/export
- Reporting
- Auth/RBAC
- Storage/attachments
- Docker/devops
- Testing
- Observability

For each idea, include:

- Source repo
- Source file path
- What is useful
- Whether to copy, rewrite or avoid
- How to adapt to final stack

### Step 4 — Identify strict rejections

Create:

```text
repo-audit/DO_NOT_USE.md
```

List all code/patterns to reject:

- Prisma code
- Supabase-specific runtime code
- Neon/serverless-only DB code
- cloud-only storage assumptions
- AGPL/Elastic code copying risk
- insecure auth/session handling
- no-validation endpoints
- migration anti-patterns
- weak error handling
- untested business rules
- AI/demo code that is not production-grade

### Step 5 — Create final target design

Create:

```text
repo-audit/TARGET_ARCHITECTURE.md
repo-audit/TARGET_DATA_MODEL.md
repo-audit/TARGET_API_DESIGN.md
repo-audit/TARGET_UI_MODULES.md
repo-audit/TARGET_DEVOPS.md
repo-audit/TARGET_QA_PLAN.md
```

The target design must be for a fresh repo using:

- Next.js
- TypeScript
- Drizzle
- PostgreSQL
- Valkey
- MinIO
- Docker Compose
- OpenTelemetry/Prometheus/Grafana

### Step 6 — Produce implementation backlog

Create:

```text
repo-audit/IMPLEMENTATION_BACKLOG.md
```

Backlog must be phase-wise.

Each phase must include:

- Goal
- Scope
- Files/folders to create
- DB tables/migrations
- API/server actions
- UI screens
- Tests
- Acceptance criteria
- Out-of-scope
- Risks
- Manual QA checklist
- Product testing checklist

## Anti-hallucination rules

Follow these strictly:

1. Do not claim a repo has a feature unless you found it in the code or README.
2. Always mention file paths for evidence.
3. If code is unclear, say “unclear” and list what needs manual review.
4. Do not invent DB tables.
5. Do not invent endpoints.
6. Do not migrate Prisma code blindly; translate concepts into Drizzle.
7. Do not copy license-risk code.
8. Do not add paid/cloud dependencies.
9. Do not change requirements without asking.
10. Do not implement until all audit files are created.

## Output required

At the end, provide:

1. Repo ranking
2. Best parts to take from each repo
3. What to reject from each repo
4. Recommended final architecture
5. Recommended schema modules
6. Phase-wise implementation plan
7. QA/testing strategy
8. Risks and mitigations
9. Exact next prompt to begin Phase 1 implementation
