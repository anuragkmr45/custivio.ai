# Restore Rehearsal

Run a monthly restore rehearsal on a non-production VM.

1. Take fresh PostgreSQL, MinIO, and Valkey backups.
2. Copy backups to the rehearsal VM.
3. Restore PostgreSQL with `CONFIRM_RESTORE=yes`.
4. Restore MinIO and Valkey with `CONFIRM_RESTORE=yes`.
5. Start a staging app LXC against the restored services.
6. Verify login, asset list, attachment download, stock flow, report export, and worker processing.
7. Record timestamp, backup IDs, duration, failures, and operator name under `/var/backups/custivio/restore-rehearsals`.

Do not rely only on Proxmox snapshots for PostgreSQL recovery.
