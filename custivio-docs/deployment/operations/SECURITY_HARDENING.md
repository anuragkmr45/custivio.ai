# Security Hardening

## Implemented Controls

- Global response headers from the Fastify security plugin:
  - `Content-Security-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Permissions-Policy`
  - `Referrer-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
- Valkey-backed login rate limit: 10 attempts per tenant/email/IP per 60 seconds.
- Protected operational API at `/api/ops/status`.
- Public machine-readiness endpoints at `/api/health/live`, `/api/health/ready`, `/api/metrics`,
  and `/api/ops/status`.

## Operator Checks

1. Confirm TLS termination sets HTTPS and forwards `x-forwarded-for`.
2. Confirm cookies are secure in HTTPS environments.
3. Confirm failed login bursts return HTTP 429.
4. Confirm protected operational/admin APIs require an authenticated session and permission checks.
5. Confirm raw database errors are not returned to clients.

## Remaining Hardening

- Add production identity-provider integration after local admin bootstrap is designed.
- Keep authorized streaming downloads as the default until a presigned URL decision is approved.
