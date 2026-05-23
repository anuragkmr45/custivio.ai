# Custivio Seven Persona Walkthrough

Report date: 2026-05-23

Persona readiness: READY

## Personas

| Persona              | Login | Dashboard | Navigation | Allowed pages | Forbidden pages | Allowed actions | Forbidden actions/backend denial | Logout | 401/session behavior | Status   | Notes                                                |
| -------------------- | ----- | --------- | ---------- | ------------- | --------------- | --------------- | -------------------------------- | ------ | -------------------- | -------- | ---------------------------------------------------- |
| Super/Admin          | PASS  | PASS      | PASS       | PASS          | N/A             | PASS            | N/A                              | PASS   | PASS                 | COMPLETE | Admin mutation workflow covers full product actions. |
| Asset Manager        | PASS  | PASS      | PASS       | PASS          | PASS            | PASS            | PASS                             | PASS   | PASS                 | COMPLETE | Forbidden admin/report routes verified.              |
| Store/Inventory User | PASS  | PASS      | PASS       | PASS          | PASS            | PASS            | PASS                             | PASS   | PASS                 | COMPLETE | Backend admin-user mutation denial returned 403.     |
| Technician           | PASS  | PASS      | PASS       | PASS          | PASS            | PASS            | PASS                             | PASS   | PASS                 | COMPLETE | Backend admin-user mutation denial returned 403.     |
| Manager/Approver     | PASS  | PASS      | PASS       | PASS          | PASS            | PASS            | PASS                             | PASS   | PASS                 | COMPLETE | Backend admin-user mutation denial returned 403.     |
| Auditor              | PASS  | PASS      | PASS       | PASS          | PASS            | PASS            | PASS                             | PASS   | PASS                 | COMPLETE | Backend admin-user mutation denial returned 403.     |
| Read-only Viewer     | PASS  | PASS      | PASS       | PASS          | PASS            | PASS            | PASS                             | PASS   | PASS                 | COMPLETE | Backend admin-user mutation denial returned 403.     |

## Browser Evidence

| Command                                                              | Result         | Coverage                                                                    |
| -------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `npm run test:browser -- tests/browser/customer-release-uat.spec.ts` | PASS, 8 tests  | Admin mutation workflow plus seven persona access/denial/logout/401 checks. |
| `npm run test:browser`                                               | PASS, 10 tests | Full customer and real-user browser UAT suite passed.                       |

## Persona Checks Performed

- Login with UAT persona credentials.
- Dashboard and allowed route visibility.
- Permission-aware navigation checks through allowed and forbidden pages.
- Forbidden pages show access denied.
- Non-admin backend mutation to `/api/admin/users` returns 403.
- Logout returns the user to login.
- Accessing `/assets` after logout redirects to login.

## Manual Staging Note

Local browser automation covers all seven personas. A final manual walkthrough on the actual customer staging URL is still recommended to verify DNS, HTTPS, CORS, cookie policy, and customer network conditions.
