# Custivio Frontend Cloud Showcase Deployment

Report date: 2026-05-22

The authoritative full-stack cloud showcase docs live under `custivio/docs/deployment/cloud-showcase/`.

## Frontend Target

- Host Custivio Web on Netlify Free or Vercel Hobby.
- Set `VITE_API_BASE_URL` to the HTTPS backend URL.
- Keep cookie auth credentialed with backend CORS configured for the exact frontend origin.
- Prefer same parent-domain subdomains, for example `app.example.com` and `api.example.com`.

## Status

| Area                    | Status              | Notes                                                                              |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Frontend env example    | COMPLETE            | `.env.example` and `.env.cloud-showcase.example` exist.                            |
| Netlify docs            | COMPLETE            | See `custivio/docs/deployment/cloud-showcase/FRONTEND_NETLIFY_DEPLOYMENT.md`.      |
| Vercel docs             | COMPLETE            | See `custivio/docs/deployment/cloud-showcase/FRONTEND_VERCEL_DEPLOYMENT.md`.       |
| Cross-site cookie notes | COMPLETE            | See `CLOUD_ENV_VARIABLES.md` and `CLOUD_SHOWCASE_STRATEGY.md`.                     |
| Validation              | COMPLETE_WITH_NOTES | Local build and full-system E2E passed; provider deployment still needs execution. |

## Showcase Validation Checklist

1. Configure `VITE_API_BASE_URL`.
2. Build with `npm run build`.
3. Deploy frontend.
4. Configure backend `CORS_ALLOWED_ORIGINS` with the deployed frontend URL.
5. Confirm HTTPS and secure cookie behavior.
6. Run login, dashboard, asset list/create, attachment upload/download, stock movement, import/process, and export/download smoke checks.
