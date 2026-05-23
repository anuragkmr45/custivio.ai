# Custivio Maintenance Checklist

## Weekly

- Review health, readiness, and ops status.
- Review low-stock items and open maintenance tickets.
- Review failed imports, exports, and worker jobs.
- Check backup completion.

## Monthly

- Run restore rehearsal for a sample backup.
- Review user and role assignments.
- Review audit logs for unusual activity.
- Review MinIO bucket usage and database growth.
- Patch OS and container base images through the approved release process.

## Before Upgrade

- Export release manifest.
- Confirm backup completion.
- Confirm migration notes.
- Confirm rollback command and previous release path.
- Run validation scripts in staging or maintenance environment.

