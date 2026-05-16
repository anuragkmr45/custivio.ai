# Enterprise Tech Inventory System — Repo Shortlist

Generated for building a new on-prem / air-gapped inventory and IT asset management platform.

## Target requirement

Final system must use:

- React / Next.js with TypeScript
- Node.js only where useful
- Drizzle ORM only
- PostgreSQL only
- No Prisma in final project
- Valkey for cache, queues, locks and rate limiting
- MinIO for file/object storage
- Docker Compose for local/dev dependencies
- All critical libraries must be usable in on-prem / air-gapped deployment
- Enterprise-grade inventory for computers, servers, cables, chips, network devices, licenses, accessories, consumables and related hardware

## Important finding

No single public GitHub repo found that satisfies all requirements exactly. The best approach is:

1. Use stack-fit repos for architecture and implementation patterns.
2. Use domain-fit repos for inventory/asset-management ideas only.
3. Build a fresh repo using latest versions and your own clean architecture.
4. Do not directly copy code from repos with incompatible stack, unclear license, AGPL/Elastic license, cloud lock-in, Prisma, Supabase or archived status.

---

## Tier 1 — Best repos to analyze first

| Priority | Repo | URL | Why useful | What to copy conceptually | Warning |
|---|---|---|---|---|---|
| 1 | FinOpenPOS | https://github.com/JoaoHenriqueBarbosa/FinOpenPOS | Modern Next.js + TypeScript + Drizzle + tRPC architecture; inventory and product logic; current stack reference | Project structure, Drizzle schema style, tRPC/API patterns, checks, Docker build, migration approach | Uses PGLite by default; convert fully to PostgreSQL-only |
| 2 | dashboard-boilerplate | https://github.com/matthias-goupil/dashboard-boilerplate | Very close infra reference: Next.js, TypeScript, Drizzle, PostgreSQL, MinIO, Docker Compose | Docker Compose, MinIO integration, dashboard structure, service layering | Boilerplate, not inventory-specific |
| 3 | QUANTUM-STASH | https://github.com/pjborowiecki/QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind | Inventory app using Next.js, TypeScript, Postgres, Drizzle, NextAuth | Inventory pages, CRUD flow, auth/db integration ideas | WIP, no release, Neon/serverless orientation, older Next.js |
| 4 | Filadex | https://github.com/the-luap/filadex | Self-hosted inventory using PostgreSQL, Drizzle config and Docker deployment | Inventory filtering, stats, usage tracking, self-host Docker patterns | Vite/React, not Next.js; 3D filament domain; “AI-coded” repo |
| 5 | bffless/ce | https://github.com/bffless/ce | Uses NestJS/TypeScript/PostgreSQL/Drizzle/MinIO/Docker; useful if backend service split is needed | File/object storage, MinIO, auth, backend separation patterns | Not inventory-specific; BFF/tooling product |

---

## Tier 2 — Domain references only

These are useful for enterprise asset-management workflows, but should not be used as the direct final stack.

| Repo | URL | Why useful | Why not direct base |
|---|---|---|---|
| SAMS | https://github.com/karthik558/SAMS | Excellent physical asset lifecycle ideas: QR, tickets, audits, locations, ownership, reports, offline cache | Supabase and Vite stack; not Drizzle/Postgres-only |
| Sanchay | https://github.com/Prajwal-kp-18/Sanchay | Best hardware-inventory domain reference: computers, communication devices, servers, equipment, barcode/RFID, lifecycle, RBAC | Uses Prisma; not allowed in final |
| Roomer | https://github.com/c0dewhacker/Roomer | Enterprise self-host ideas: LDAP/OIDC/SAML/SCIM, webhooks, Prometheus metrics, asset registry, bookings/floor plans | Uses Prisma; Elastic License; not a direct code base |
| PartPilot | https://github.com/PartPilotLab/PartPilot | Electronics parts/chips inventory: LCSC integration, barcode scanning, part catalog | Uses Prisma, AGPL-3.0, says not production ready |
| Panthora | https://github.com/KennethWussmann/panthora | Good generic inventory concepts: asset types, labels, tags, teams, SSO | Archived/pre-release; do not base production work on it |
| ChittyAssets | https://github.com/chittyos/chittyassets | Low-star asset dashboard/API/filtering patterns; Drizzle/Postgres present | Not Next.js; contains cloud/blockchain/AI concepts that are not required |

---

## Recommended repo analysis order for Codex

Place cloned repos in one parent folder like this:

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

Analyze in this order:

1. FinOpenPOS
2. dashboard-boilerplate
3. QUANTUM-STASH
4. Filadex
5. bffless/ce
6. SAMS
7. Sanchay
8. Roomer
9. PartPilot
10. Panthora
11. ChittyAssets

## What to reject during analysis

Reject or rewrite any code/pattern that depends on:

- Prisma
- Supabase cloud-only assumptions
- Neon/serverless-only assumptions
- Firebase
- MongoDB
- Paid SaaS APIs for core workflows
- Redis-only assumptions where Valkey should be used
- Cloud object storage assumptions where MinIO should be used
- AGPL/Elastic licensed source code copying unless legally approved
- Undocumented AI-generated code without tests
- Any pattern that cannot run inside an air-gapped Docker/on-prem environment

## What to preserve

Extract only architecture, UX and domain ideas such as:

- Asset hierarchy
- Asset type templates
- Serial-number/asset-tag uniqueness
- Lifecycle status tracking
- QR/barcode workflow
- Location tree
- User/custodian assignment
- Department/project assignment
- Stock ledger
- Check-in/check-out
- Maintenance tickets
- Warranty tracking
- Audit logs
- Import/export
- Reports/dashboard
- Role matrix
- Attachment handling
- MinIO object metadata
- Search/filter UX
- Data validation patterns
- Testing patterns
