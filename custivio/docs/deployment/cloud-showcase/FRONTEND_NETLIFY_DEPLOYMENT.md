# Frontend Netlify Deployment

Build command:

```bash
npm run build
```

Publish directory:

```text
dist/client
```

Required environment:

```text
VITE_API_BASE_URL=https://api.showcase.example.com
```

Notes:

- Add the Netlify site URL to backend `CORS_ALLOWED_ORIGINS`.
- Cross-site cookie auth requires HTTPS and compatible SameSite/secure cookie settings.
- Prefer a shared parent domain such as `app.example.com` and `api.example.com`.
