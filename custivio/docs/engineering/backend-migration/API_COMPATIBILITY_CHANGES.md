# API Compatibility Changes

This file records behavior differences introduced during the Next.js API to Fastify migration.

## Preserved Behavior

- Existing `/api/...` paths from `apps/web/app/api/**` are registered in Fastify under `apps/api/src/routes/**`.
- Existing JSON error shape is preserved:
  `{ "error": { "code": string, "message": string, "requestId": string } }`.
- `x-request-id` response header is preserved.
- `custivio_session` cookie name and login/logout JSON behavior are preserved.
- Login and logout continue to support non-JSON form clients with redirects.
- Multipart asset upload still uses form field `file`.

## Additive API Surface

These routes were added to resolve backend blockers and do not replace existing paths:

- `GET /api/assets/:id/attachments/:attachmentId/download`
- `DELETE /api/assets/:id/attachments/:attachmentId`
- `GET /api/reports/exports/:exportId/download`
- `GET /api/locations/:resource`
- `POST /api/locations/:resource`
- `PATCH /api/locations/:resource`
- `PATCH /api/locations/:resource/:id`
- `DELETE /api/locations/:resource`
- `DELETE /api/locations/:resource/:id`
- Admin mutation routes for users, roles, and role assignments.
- `GET /api/openapi.json`
- `GET /api/docs`

## Intentional Non-Implementation

- `GET /api/files/:objectId/download` was not added because the codebase does not currently have a generic file/object metadata abstraction. Asset attachments and report exports have dedicated authorized download routes instead.

## Current Removal Status

No Next.js files were removed in this migration step. `apps/web` stays in place until the full removal gates from `docs/engineering/backend-migration/NEXT_REMOVAL_PLAN.md` pass, including DB-backed integration tests and Docker verification.
