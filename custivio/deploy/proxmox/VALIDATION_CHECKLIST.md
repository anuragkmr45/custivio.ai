# Validation Checklist

- Required Proxmox docs exist.
- README links Proxmox deployment docs.
- Canonical paths are documented.
- Example env files contain placeholders only.
- Scripts are executable and pass `bash -n`.
- App LXC files do not require Docker-in-LXC.
- Data VM services bind private IPs only.
- Shared observability targets use `org`, `software`, `environment`, `role`, and `instance` labels.
- Internal services are not documented as public.
- Release bundle manifest and checksum files are present.
- Update and rollback docs require backup and validation.
