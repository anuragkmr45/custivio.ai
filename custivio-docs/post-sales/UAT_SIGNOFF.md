# UAT Signoff

## Status

Current UAT status: `passed_with_gaps`.

## Completed Coverage

- Authentication and tenant-scoped navigation.
- Admin users, roles, and assignments.
- Catalog setup.
- Asset creation, detail, attachment, and lifecycle flow.
- Stock unit/item creation and receive/issue flow.
- Custody checkout, handover, check-in, and transfer approval.
- Maintenance ticket and warranty recording.
- Audit campaigns, scan results, import preview/process, exports, and saved filters.
- Operational status and health endpoints.

## Known Product Gaps

- Password reset and production identity-provider integration are not implemented.
- Attachment download/delete and signed export downloads remain future work.
- Background workers for long-running imports and exports remain future work.
- Next `middleware.ts` to `proxy.ts` convention migration remains hardening work.

## Signoff Criteria

- All release gates in `docs/operations/RELEASE_CHECKLIST.md` pass.
- PM confirms business labels and workflows are understandable.
- Operations confirms backup, restore, and observability runbooks are acceptable.
