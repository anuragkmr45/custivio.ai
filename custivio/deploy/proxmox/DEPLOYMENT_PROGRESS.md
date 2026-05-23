# Proxmox Deployment Progress

## Current status

Deployment scaffold, operator docs, scripts, templates, validation checks, shared observability project, and final audit have been created.

## Important implementation notes

- Existing Docker production and air-gap docs are preserved.
- Proxmox deployment uses systemd for the app LXC and Docker Compose for the data VM by default.
- Backend release packaging uses the current source/workspace runtime model because API build currently runs `tsc --noEmit` and does not emit JavaScript.
- Frontend artifact packaging expects `custivio-web/dist/client` as the static client output. If SSR is required later, add an explicit frontend server service as a separate deployment change.

## Next operator action

Run `bash custivio/deploy/proxmox/scripts/validate-all.sh` from the repository root or `bash deploy/proxmox/scripts/validate-all.sh` from `custivio/`.
