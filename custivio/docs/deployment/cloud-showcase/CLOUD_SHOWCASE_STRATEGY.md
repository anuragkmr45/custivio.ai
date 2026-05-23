# Custivio Cloud Showcase Strategy

Report date: 2026-05-22

The free showcase deployment is for demos only. Proxmox/on-prem remains the production deployment strategy.

Preferred pattern:

- Frontend: Netlify Free or Vercel Hobby.
- Backend/data: Oracle Cloud Always Free VM running Docker Compose with API, worker, PostgreSQL, Valkey, MinIO, and reverse proxy.

Alternative demo pattern:

- Frontend: Netlify/Vercel static hosting.
- Backend: Render free service or similar.
- Data/object storage: external PostgreSQL plus S3-compatible storage. This is less durable and may have free-tier expiration or sleep limitations.

Showcase success criteria:

- HTTPS frontend and backend.
- Cookie auth works with credentialed CORS.
- UAT seed is loaded.
- Login, dashboard, assets, attachments, stock, imports, and exports can be demonstrated.
