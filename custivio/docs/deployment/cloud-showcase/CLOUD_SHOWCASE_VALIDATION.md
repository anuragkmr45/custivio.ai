# Cloud Showcase Validation

Run after deployment:

1. Backend `/api/health/live`.
2. Backend `/api/health/ready`.
3. Backend `/api/openapi.json`.
4. Frontend build loads.
5. UAT admin login succeeds.
6. Dashboard loads real data.
7. Asset list and asset create work.
8. Attachment upload/download works.
9. Stock movement works.
10. Import job create/process works.
11. Export job create/download works.
12. Logout clears session and `/api/auth/me` returns 401.
