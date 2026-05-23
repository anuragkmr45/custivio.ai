# Custivio Security And On-Prem Brief

Custivio is designed for controlled infrastructure and restricted environments.

## Security Controls

- Tenant-scoped data model and service-layer tenant resolution.
- Role-based permissions for assets, catalog, stock, custody, maintenance, audits, imports, exports, reports, users, roles, and locations.
- Cookie-backed sessions with server-side validation.
- MinIO/S3-compatible object storage for production attachments and export files.
- Valkey-backed rate limits, idempotency, locks, and worker queue primitives.
- Audit logs for protected mutations.
- Health, readiness, ops status, metrics, and deployment validation scripts.

## Infrastructure Control

- PostgreSQL remains under customer control.
- Object storage remains under customer control.
- Observability can run in a shared internal stack.
- Air-gapped release preparation is documented for restricted environments.

## Buyer Note

Security posture depends on correct operator setup: strong secrets, TLS, firewall rules, backup schedules, restricted service accounts, and tested restore rehearsals.

