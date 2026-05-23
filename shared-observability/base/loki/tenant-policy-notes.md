# Loki Tenant Policy Notes

Loki is bound to the private observability network only. For multi-org deployments, add an authenticating reverse proxy that injects `X-Scope-OrgID` or use strict labels such as `org`, `software`, and `environment`. Do not expose Loki publicly.
