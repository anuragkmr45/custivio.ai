# Enterprise Inventory Platform

Fresh Phase 1 scaffold for an on-prem and air-gapped inventory and IT asset management platform.

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- Docker Desktop or Docker Engine with Compose

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Health endpoints:

- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /api/metrics`

## Verification

```bash
pnpm check
```

This repository is a fresh implementation. The audit reports in `../repo-audit` are references only and are not source-copy inputs.
