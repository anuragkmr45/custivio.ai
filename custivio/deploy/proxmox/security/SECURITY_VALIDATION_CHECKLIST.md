# Security Validation Checklist

- App LXC unprivileged.
- API and worker run as `inventory`.
- Env files mode 0640.
- No default credentials.
- Internal services not public.
- Firewall rules match the port matrix.
- Release folders do not contain secrets.
- Backups exist and restore rehearsal is scheduled.
- Proxmox admin accounts use 2FA.
- Snapshots are not the only DB restore method.
