# QA and Product Testing Acceptance Checklist

This checklist should be used after every implementation phase.

---

## Universal quality gates

Every phase must pass:

- TypeScript typecheck
- lint
- format check
- unit tests
- integration tests for changed modules
- no Prisma dependency introduced
- no Supabase/Firebase/MongoDB dependency introduced
- no cloud-only dependency introduced
- no secret committed
- env variables documented in `.env.example`
- migrations committed
- rollback/migration notes updated
- audit logging added for important mutations
- permission checks added for protected mutations
- tenant isolation maintained

---

## Security tests

### Authentication

- Invalid login fails.
- Valid login succeeds.
- Session expiry works.
- Logout invalidates session.
- Disabled user cannot login.

### Authorization

- Normal user cannot access admin screens.
- User from tenant A cannot access tenant B data.
- Department-scoped user cannot access unrelated department.
- Read-only user cannot mutate data.
- API/server action permissions match UI permissions.

### Upload security

- Only allowed file types accepted.
- File size limits enforced.
- Files are stored in MinIO, not local app folder.
- Object keys do not expose unsafe user input.
- Deleted attachment metadata cannot be used to fetch object.
- Download requires permission.

---

## Asset-management tests

### Asset registry

- Create asset with required fields.
- Create asset with type-specific fields.
- Duplicate serial number is rejected.
- Duplicate asset tag is rejected.
- Asset status changes are logged.
- Asset history is visible and immutable.

### Location

- Asset can be assigned to location.
- Location hierarchy works.
- Location deletion is blocked when assets exist.
- Move operation writes movement event.

### Custody

- Asset can be assigned to user/custodian.
- Check-out/check-in works.
- Transfer approval works.
- Rejected transfer keeps old ownership.
- Movement history cannot be edited.

### Stock

- Receive stock increases balance.
- Issue stock decreases balance.
- Transfer stock changes source and target balances.
- Adjustment requires reason.
- Negative balance is blocked.
- Low-stock alert appears.

### Maintenance

- Ticket open/assign/close flow works.
- Preventive maintenance schedule appears.
- Warranty expiry report works.
- Repair attachment upload works.
- Downtime is calculated.

### Audit

- Audit campaign can be created.
- Auditor can verify assets.
- Missing asset flow works.
- Damaged asset flow works.
- Submitted audit cannot be changed unless reopened by admin.
- Audit report exports correctly.

---

## Import/export tests

- Download template works.
- Valid CSV import works.
- Valid XLSX import works.
- Invalid rows are rejected with row numbers.
- Duplicate rows are reported.
- Large import runs as background job.
- Import can be retried safely.
- Export generated and stored in MinIO.
- Export download requires permission.

---

## Observability tests

- `/api/health/live` responds without DB.
- `/api/health/ready` checks DB, Valkey and MinIO.
- `/api/metrics` returns Prometheus metrics.
- Slow request logs are captured.
- Errors have request IDs.
- Trace ID appears in logs.
- Grafana dashboard loads.
- Prometheus target is up.
- OTel collector receives telemetry.

---

## Product UAT scenarios

### Scenario 1 — New laptop procurement

1. Admin creates asset type “Laptop”.
2. Admin adds custom fields: CPU, RAM, storage, OS.
3. Store user bulk imports 20 laptops.
4. System generates asset tags.
5. IT assigns one laptop to employee.
6. Employee handover PDF/export is generated.
7. Asset appears under employee custody.

Expected result:

- Asset count increases.
- Assignment history exists.
- Audit log exists.
- QR code exists.
- Current custodian is correct.

### Scenario 2 — Server rack inventory

1. Admin creates site/building/floor/room/rack.
2. IT adds server asset with serial number.
3. IT uploads invoice/warranty PDF.
4. IT assigns server to rack.
5. IT opens maintenance ticket.
6. Manager views maintenance dashboard.

Expected result:

- Server is linked to physical rack.
- Attachment is in MinIO.
- Warranty and ticket visible on asset page.
- Dashboard count is correct.

### Scenario 3 — Cable and consumable stock

1. Store user creates item “CAT6 cable”.
2. Store user receives 100 units.
3. Technician issues 10 units to project.
4. System shows balance 90.
5. Low-stock rule is configured.
6. Report shows movement history.

Expected result:

- Ledger has receive and issue entries.
- Balance is correct.
- Movement cannot be edited.
- Stock report exports.

### Scenario 4 — Physical audit

1. Admin creates audit campaign for one room.
2. Auditor scans/marks assets verified.
3. One asset is marked missing.
4. One asset is marked damaged with photo.
5. Audit is submitted.
6. Manager exports report.

Expected result:

- Audit result is locked.
- Missing/damaged summary is correct.
- Evidence is stored in MinIO.
- Report export works.

---

## Release acceptance

Before a release is accepted:

- All critical bugs closed.
- No P0/P1 open issues.
- Known limitations documented.
- Backup and restore verified.
- Clean install verified.
- Upgrade migration verified.
- Offline Docker image/package instructions verified.
- Admin guide prepared.
- User guide prepared.
- QA sign-off completed.
