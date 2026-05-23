# Custivio Proxmox Deployment

This folder contains the Proxmox deployment layer for Custivio. It is written for a new operator deploying the app into an app LXC, a data VM, and a reusable shared observability node.

## Read first
1. `docs/PROXMOX_DEPLOYMENT_INDEX.md`
2. `docs/DEPLOYMENT_PATH_STRATEGY.md`
3. `docs/NEW_OPERATOR_QUICKSTART.md`
4. `custivio-release/FIRST_TIME_DEPLOYMENT.md`
5. `docs/UPDATE_PATCH_RUNBOOK.md`
6. `docs/ROLLBACK_RUNBOOK.md`

## Validate
From `custivio/` run:

```bash
bash deploy/proxmox/scripts/validate-all.sh
```
