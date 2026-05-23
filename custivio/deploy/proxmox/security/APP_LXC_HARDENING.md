# App LXC Hardening

- Use unprivileged LXC.
- No privileged mode, host mounts, or Docker-in-LXC by default.
- Run API and worker as non-root `inventory`.
- Store secrets under `/etc/custivio` mode 0640.
- Expose only reverse proxy 80/443.
- Bind API to localhost/private IP.
- Keep release folders immutable and data out of release folders.
- Use systemd hardening options from provided unit files.
