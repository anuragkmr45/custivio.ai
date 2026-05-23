# Role And Assignment Layout Report

Report date: 2026-05-23

## Scope

- `/roles`
- `/assignments`

## Changes

- `/roles` now uses a viewport-limited content area so the page does not grow endlessly when there are many roles or permissions.
- The role list scrolls inside its own panel.
- The selected role permission matrix scrolls inside its own panel.
- The role list has client-side pagination for long tenant role sets.
- `/assignments` now uses a viewport-limited matrix panel with internal vertical and horizontal scrolling.
- Assignment users are paginated client-side so large user lists do not make the page excessively long.

## Backend Impact

None. The existing admin roles and assignments APIs remain unchanged.

## Validation

- Pagination helper unit coverage added in `src/lib/pagination.test.ts`.
- Frontend lint, typecheck, unit tests, and build should be run after this change.
