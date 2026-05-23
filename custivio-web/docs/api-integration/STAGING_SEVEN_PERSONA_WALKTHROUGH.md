# Custivio Staging Seven Persona Walkthrough

Report date: 2026-05-23

Readiness: EXTERNAL_PENDING

Reason: no staging frontend URL, API URL, DNS, TLS, or staging credentials were provided in this workspace.

## Required Inputs

| Input                | Status           | Notes                                                          |
| -------------------- | ---------------- | -------------------------------------------------------------- |
| Staging frontend URL | EXTERNAL_PENDING | Example: `https://custivio-staging.example.com`.               |
| Staging API URL      | EXTERNAL_PENDING | May be same origin under `/api`.                               |
| Persona credentials  | EXTERNAL_PENDING | Use staging bootstrap/admin or UAT seed only for demo staging. |
| Browser test command | READY            | `npm run test:browser` supports staging env values.            |

## Walkthrough Matrix

| Persona          | Login            | Allowed pages    | Forbidden pages  | Allowed actions  | Forbidden actions | Logout           | 401 behavior     | Result           | Notes                                                                                                                                                               |
| ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ----------------- | ---------------- | ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin            | EXTERNAL_PENDING | EXTERNAL_PENDING | N/A              | EXTERNAL_PENDING | N/A               | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Full admin workflow should cover users, roles, catalog, locations, assets, stock, custody, transfers, maintenance, warranty, audits, imports, exports, and reports. |
| Asset Manager    | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING  | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Verify asset/catalog/location actions allowed and admin-only actions denied.                                                                                        |
| Store User       | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING  | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Verify stock receive/issue allowed and admin mutations denied.                                                                                                      |
| Technician       | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING  | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Verify maintenance-related access and admin mutation denial.                                                                                                        |
| Manager/Approver | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING  | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Verify transfer decision path and admin mutation denial.                                                                                                            |
| Auditor          | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING  | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Verify audit/report access and non-audit mutation denial.                                                                                                           |
| Read-only Viewer | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING  | EXTERNAL_PENDING | EXTERNAL_PENDING | EXTERNAL_PENDING | Verify read access only and all mutations denied.                                                                                                                   |

## Browser Command

```bash
E2E_FRONTEND_BASE_URL=https://<staging-domain> \
E2E_API_BASE_URL=https://<staging-domain> \
E2E_ADMIN_EMAIL=<admin-email> \
E2E_MANAGER_EMAIL=<manager-email> \
E2E_STORE_EMAIL=<store-email> \
E2E_TECHNICIAN_EMAIL=<technician-email> \
E2E_APPROVER_EMAIL=<approver-email> \
E2E_AUDITOR_EMAIL=<auditor-email> \
E2E_VIEWER_EMAIL=<viewer-email> \
E2E_PASSWORD=<uat-or-staging-password> \
npm run test:browser
```

## Manual Checklist Per Persona

1. Login.
2. Confirm dashboard loads.
3. Confirm expected navigation items are visible.
4. Open each allowed page.
5. Attempt at least one forbidden page.
6. Perform one allowed action.
7. Attempt one forbidden mutation and confirm backend denies it.
8. Logout.
9. Visit `/assets` after logout and confirm redirect to login.
10. Record result, timestamp, browser, staging URL, and notes.
