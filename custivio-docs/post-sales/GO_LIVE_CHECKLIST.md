# Custivio Go-Live Checklist

- Production environment variables are set with strong secrets.
- No default admin credentials are present.
- PostgreSQL, Valkey, and MinIO readiness checks pass.
- TLS, CORS, firewall, and reverse proxy configuration are verified.
- Admin, manager, inventory clerk, and auditor logins are tested.
- Core flows pass: asset create/update, attachment upload/download, stock receive/issue/transfer, custody checkout/check-in, maintenance ticket, audit scan, import preview, export.
- Backup and restore runbooks are available to operators.
- Observability dashboard and alerts are visible to administrators.
- Rollback path is documented and tested for the release.

