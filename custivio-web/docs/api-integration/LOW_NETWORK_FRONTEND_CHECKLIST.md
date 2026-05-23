# Custivio Low Network Frontend Checklist

Report date: 2026-05-22

## Current Status

Low-network frontend readiness: READY_WITH_NOTES

| Area              | Status              | Required behavior                                                        | Notes                                                                             |
| ----------------- | ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| API timeout       | COMPLETE            | Requests fail with clear timeout message.                                | `apiRequest` has `timeoutMs` and default 20s timeout.                             |
| Retry UX          | COMPLETE_WITH_NOTES | Every data page can retry failed load.                                   | `ApiErrorPanel` provides retry; browser slow-flow evidence remains pending.       |
| Loading states    | COMPLETE_WITH_NOTES | Every data page and mutation has visible pending state.                  | Core routes use loading panels and pending disabled buttons.                      |
| Duplicate submits | COMPLETE_WITH_NOTES | Mutations disable submit while pending and use idempotency where needed. | Stock/import/export idempotency exists; double-click browser test remains future. |
| Tables            | COMPLETE_WITH_NOTES | Server pagination/search or safe limits.                                 | Asset registry uses server mode; bounded admin/catalog lists remain client mode.  |
| Jobs              | COMPLETE_WITH_NOTES | Conservative polling, terminal-state stop, last updated time.            | Reporting polling stops unless job status is active.                              |
| Uploads           | COMPLETE_WITH_NOTES | Show file size, limit, waiting state, retryable failure.                 | Asset attachment upload blocks files over 10 MiB and shows pending file size.     |
