# Custivio Backup Rehearsal Guide

Use this guide with the deployment backup and restore runbooks.

1. Select the backup set for PostgreSQL, MinIO, and Valkey.
2. Restore into a non-production environment.
3. Run database migrations if the runbook requires them.
4. Start API, worker, object storage, cache, and frontend.
5. Verify `/api/health/ready`.
6. Log in as an administrator.
7. Open assets, stock, custody, maintenance, and audit screens.
8. Download a known attachment or export file.
9. Record duration, backup IDs, operator, errors, and corrective actions.
10. Store rehearsal evidence with the operational runbook.

