# Data VM Hardening

- PostgreSQL, MinIO, and Valkey are private only.
- Use separate disks/volumes under `/srv/custivio-data`.
- Store backups under `/var/backups/custivio`.
- Use least-privilege app DB user.
- Do not use default MinIO credentials.
- Require restore rehearsals before production signoff.
- Encrypt backups where policy requires.
