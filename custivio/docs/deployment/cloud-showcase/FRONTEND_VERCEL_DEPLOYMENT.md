# Frontend Vercel Deployment

Build command:

```bash
npm run build
```

Output directory:

```text
dist/client
```

Required environment:

```text
VITE_API_BASE_URL=https://api.showcase.example.com
```

Notes:

- Add Vercel preview and production URLs to backend `CORS_ALLOWED_ORIGINS`.
- Vercel Hobby has plan and usage limits; use it only for showcase demos.
- HTTPS is required for cross-site cookie auth.
