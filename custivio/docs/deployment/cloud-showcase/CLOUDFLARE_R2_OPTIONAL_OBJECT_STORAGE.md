# Cloudflare R2 Optional Object Storage

Cloudflare R2 can be used as an S3-compatible object store for a cloud showcase if MinIO is not available.

Required mapping:

- `MINIO_ENDPOINT`: R2 S3-compatible endpoint.
- `MINIO_ACCESS_KEY`: R2 access key.
- `MINIO_SECRET_KEY`: R2 secret key.
- `MINIO_BUCKET`: R2 bucket name.
- `MINIO_REGION`: provider-supported region value.

Notes:

- This is a demo option and is not the default on-prem strategy.
- Validate upload, authorized download, delete, checksum, and metadata behavior before demos.
