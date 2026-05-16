# Sanchay Architecture

## Structure

- Next.js app with root `actions`, `data`, `schemas`, `src/app`, `src/components`, and `src/lib`.
- Prisma client is created in `Sanchay/src/lib/db.ts:1` and `Sanchay/src/lib/db.ts:7`.
- Auth config uses NextAuth Credentials and validates email/password/govId (`Sanchay/auth.config.ts:2`, `Sanchay/auth.config.ts:23`, `Sanchay/auth.config.ts:29`).

## Runtime Boundaries

- Application code imports Prisma-backed `db` from `src/lib/db.ts`.
- Email/notification utilities use Resend (`Sanchay/src/lib/mail.ts:1`, `Sanchay/src/lib/utils/notificationLogic.ts:1`).
- Middleware wraps NextAuth (`Sanchay/src/middleware.ts:1`, `Sanchay/src/middleware.ts:2`).

## Deployment/Devops

- README lists Vercel as platform (`Sanchay/README.md:133`).
- No local Docker dependency stack found.

