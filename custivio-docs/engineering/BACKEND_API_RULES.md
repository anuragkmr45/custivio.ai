# Backend API Rules

Every protected mutation must:

1. Validate input with Zod or a comparable runtime validator.
2. Resolve the current user/session.
3. Resolve tenant context.
4. Check permissions.
5. Use a transaction if multiple tables change.
6. Write an audit log.
7. Return typed success or typed error results.
8. Hide raw database and storage errors from clients.
9. Include a request ID in logs and error responses.
10. Use idempotency keys for repeated or long-running operations.

Route handlers should stay thin. Business behavior belongs in `packages/core`, and persistence belongs in `packages/db`.
