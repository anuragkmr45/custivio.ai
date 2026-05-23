# Storage Download Decision

Decision date: 2026-05-16

## Decision

Use authorized streaming downloads through the Fastify API.

The backend will not expose direct MinIO object keys or presigned MinIO URLs as the primary frontend contract in this phase.

## Download Endpoints

| File type        | Endpoint                                                   | Permission     | Notes                                  |
| ---------------- | ---------------------------------------------------------- | -------------- | -------------------------------------- |
| Asset attachment | `GET /api/assets/{id}/attachments/{attachmentId}/download` | `assets.read`  | Tenant-scoped metadata lookup first.   |
| Report export    | `GET /api/reports/exports/{exportId}/download`             | `reports.read` | Tenant-scoped completed export lookup. |

## Security Rules

- Resolve session and tenant before file metadata lookup.
- Check backend permission before touching MinIO.
- Generate object keys only through `packages/storage/src/object-keys.ts`.
- Store metadata in PostgreSQL, not in the local filesystem.
- Return sanitized `content-disposition` headers.
- Return `content-length` from stored metadata when available.
- Validate SHA-256 checksum against PostgreSQL metadata on download.
- Soft-delete attachment metadata before best-effort MinIO object cleanup.

## Upload Rules

- Enforce max file size from `packages/storage/src/policies.ts`.
- Enforce MIME allowlist from `packages/storage/src/policies.ts`.
- Store `content_length` and `checksum_sha256` for new attachments and exports.
- If MinIO write succeeds but metadata creation fails, delete the object as compensation.

## Rationale

Authorized streaming keeps all permission and tenant checks in the backend. It avoids exposing MinIO credentials, bucket names, object keys, or presigned URL policy details to the frontend.

## Follow-up

Phase 7 production packaging can add reverse-proxy buffering and object streaming tuning if large exports require it.
