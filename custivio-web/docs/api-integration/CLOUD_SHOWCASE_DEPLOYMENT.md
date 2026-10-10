# Custivio Frontend Cloud Showcase Deployment

Report date: 2026-10-10

The authoritative full-stack cloud showcase docs live under `custivio/docs/deployment/cloud-showcase/`.

## Frontend Target

- Custivio Web is a TanStack Start application configured for Cloudflare Workers; it is not a Next.js application.
- Use the existing Cloudflare target for the isolated cloud-demo branch. A Next.js rewrite is not required for deployment.
- Use npm as the frontend package manager. Keep `package-lock.json` as the only dependency lockfile so Cloudflare does not auto-select Bun.
- Set `VITE_API_BASE_URL` to the HTTPS backend URL.
- Keep cookie auth credentialed with backend CORS configured for the exact frontend origin.
- Prefer same parent-domain subdomains, for example `app.example.com` and `api.example.com`.

## Cloudflare Build Settings

- Root directory: `custivio-web`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Runtime variable: `VITE_API_BASE_URL=https://custivio-api.onrender.com`
- No Cloudflare binding is required for the frontend.

## Status

| Area                    | Status              | Notes                                                                              |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Frontend env example    | COMPLETE            | `.env.example` and `.env.cloud-showcase.example` exist.                            |
| Cloudflare build target | COMPLETE            | `vite.config.ts` and `wrangler.jsonc` already configure the Cloudflare runtime.    |
| Cross-site cookie notes | COMPLETE            | See `CLOUD_ENV_VARIABLES.md` and `CLOUD_SHOWCASE_STRATEGY.md`.                     |
| Validation              | COMPLETE_WITH_NOTES | Local build and full-system E2E passed; provider deployment still needs execution. |

## Showcase Validation Checklist

1. Configure `VITE_API_BASE_URL` as a build-time runtime variable in Cloudflare.
2. Build with `npm run build`.
3. Deploy frontend.
4. Configure backend `CORS_ALLOWED_ORIGINS` with the deployed frontend URL.
5. Confirm HTTPS and secure cookie behavior.
6. Run login, dashboard, asset list/create, attachment upload/download, stock movement, import/process, and export/download smoke checks.
