# Legacy Brand Term Removal

## Requirement

Remove the legacy brand word from active source, configuration defaults, package identifiers, operational docs, QA docs, and archived code kept in the workspace.

## Scope

- Backend package scope and workspace filters now use `@custivio/*`.
- Backend app/service names now use `custivio`.
- Default PostgreSQL database, user, and password identifiers now use `custivio`.
- Default metrics prefix now uses `custivio_`.
- Default object-storage bucket now uses `custivio`.
- Docker image names in infra docs and local QA runbooks now use `custivio-api`.
- User-facing documentation and historical planning docs no longer use the legacy brand word.

## Out Of Scope

- No database table, column, migration, or persisted business-field rename was required.
- No API route paths were changed.
- No frontend UI workflow behavior was changed.

## Affected Folders

- `apps/api`
- `packages/*`
- `infra`
- `docs`
- `tests`
- `scripts`
- `custivio-web/docs/full-system-qa`
- root planning/reference docs under `/Users/anuragkumar/Desktop/inventory-research`

## DB Changes

No schema migration. Only default connection names and local Docker database identifiers changed. Existing local databases using the previous names should be recreated or migrated manually if needed.

## API/Server Actions

No API contract change. Internal imports changed from the old package scope to `@custivio/*`.

## UI Screens

No screen behavior change. Visible copy now uses `Custivio` or neutral wording.

## Permission Rules

No permission changes.

## Audit Log Rules

No audit log behavior changes.

## Tests

- Backend `pnpm check`
- Frontend `npm run typecheck`
- Frontend `npm run lint`
- Frontend `npm run test`
- Frontend `npm run build`

## Manual QA Checklist

- Confirm no legacy brand word remains with a case-insensitive workspace search.
- Confirm package filters resolve with the new `@custivio/*` scope.
- Confirm local Docker compose defaults use `custivio` database identifiers.
- Rebuild local QA image before replaying QA because the Docker image name changed.

## Rollback/Migration Notes

Rollback is a coordinated text/identifier revert. If an existing developer database still uses the previous local database name, either recreate it through `pnpm docker:dev` after removing old volumes or override `DATABASE_URL` explicitly.
