# Custivio Troubleshooting

## Login

| Problem                   | Resolution                                       |
| ------------------------- | ------------------------------------------------ |
| Invalid credentials       | Verify tenant code, email, and password.         |
| Access denied after login | Ask an administrator to review role assignments. |
| Session expired           | Sign in again.                                   |

## Data And Forms

| Problem                         | Resolution                                                   |
| ------------------------------- | ------------------------------------------------------------ |
| Required catalog option missing | Create the master-data record first.                         |
| Duplicate asset tag or serial   | Search assets and use a unique identifier.                   |
| Button disabled                 | Wait for the current request to finish or check permissions. |
| Table looks empty               | Clear search filters and refresh.                            |

## Files

| Problem                  | Resolution                                                              |
| ------------------------ | ----------------------------------------------------------------------- |
| Upload does not complete | Keep the browser open, verify file size, and retry on a stable network. |
| Download fails           | Retry and ask an admin to check object storage if it repeats.           |

## Jobs

| Problem                     | Resolution                                         |
| --------------------------- | -------------------------------------------------- |
| Import/export stays pending | Ask an admin to check worker and Valkey status.    |
| Export download unavailable | Wait for completed status.                         |
| Job failed                  | Review diagnostics and retry with corrected input. |

## Operator Escalation Checklist

1. Capture the page, action, timestamp, and request ID if visible.
2. Check `/api/health/ready`.
3. Check API logs for the request ID.
4. Check PostgreSQL, Valkey, MinIO, and worker health.
5. If data loss is suspected, pause writes and follow the backup/restore runbook.
