# AGENTS.md - Shared Observability

This sibling project is reusable across organizations and software systems. Do not hardcode Custivio into base files. Put software-specific targets under `orgs/<org-slug>/targets` and dashboards under `orgs/<org-slug>/dashboards` when they are not generic.

Do not store secrets in release folders. Runtime config lives under `/etc/shared-observability`, data under `/srv/shared-observability`, and backups under `/var/backups/shared-observability`.
