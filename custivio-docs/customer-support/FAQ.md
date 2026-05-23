# Custivio Support FAQ

## Which services must be running?

The API needs PostgreSQL, Valkey, and MinIO. Observability uses OpenTelemetry, Prometheus, and Grafana.

## Where are attachments stored?

Production attachments and export files are stored in MinIO/S3-compatible object storage, not the local filesystem.

## What should support ask for first?

Ask for the request ID, timestamp, user email, tenant slug, affected module, API response code, and recent operator action.

## Can support bypass RBAC?

No. Permission issues should be fixed through role assignment or role permission changes.

## What is safe to retry?

Many long-running or repeated operations use idempotency keys. Confirm the idempotency key and operation status before retrying.

