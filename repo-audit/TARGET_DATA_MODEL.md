# Target Data Model

## Core Tables

- Tenancy: `tenants`, `organizations`, `departments`.
- Access control: `users`, `sessions`, `roles`, `permissions`, `role_assignments`, `user_groups`, `group_members`.
- Location hierarchy: `sites`, `buildings`, `floors`, `rooms`, `racks`, `shelves`, `bins`.
- Asset catalog: `asset_categories`, `asset_types`, `asset_type_fields`, `manufacturers`, `models`, `vendors`.
- Assets: `assets`, `asset_identifiers`, `asset_field_values`, `asset_attachments`, `asset_events`.
- Stock: `stock_items`, `units_of_measure`, `stock_locations`, `stock_balances`, `stock_ledger`, `stock_adjustments`, `stock_transfers`, `low_stock_rules`.
- Custody: `custody_assignments`, `transfer_requests`, `handover_documents`, `movement_events`.
- Maintenance: `maintenance_tickets`, `maintenance_events`, `preventive_maintenance_schedules`, `warranty_records`, `repair_records`, `downtime_records`.
- Audit/compliance: `audit_campaigns`, `audit_scopes`, `audit_assignments`, `audit_scan_results`, `audit_findings`, `audit_submissions`, `audit_reports`, `audit_logs`.
- Imports/exports: `import_jobs`, `import_rows`, `export_jobs`, `report_jobs`, `saved_views`.
- System: `rate_limit_events`, `idempotency_keys`, `job_runs`, `notifications`.

## Required Constraints

- Every tenant-owned table includes `tenant_id`.
- Asset tags and serial numbers are unique within tenant and appropriate asset scope.
- Stock ledger is append-only; balances are derived or transactionally maintained.
- Audit logs and submitted audit results are immutable.
- Attachment rows store MinIO object key, checksum, size, MIME type, uploader, tenant, and related entity.

## Drizzle Guidance

- Use explicit indexes for tenant, status, type, location, custodian, serial, asset tag, SKU, and date filters.
- Use foreign keys for all tenant-owned references.
- Use enums conservatively; prefer lookup/config tables when admins need customization.
- Use JSON only for custom field values or import diagnostics where schema flexibility is required.

