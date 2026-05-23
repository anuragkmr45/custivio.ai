# Asset UX Human Readability Report

Report date: 2026-05-23

## Completed

- Asset list now renders catalog, custodian, and location fields as readable labels when the signed-in user can read the supporting reference data.
- Asset list no longer shows raw UUIDs in primary table columns.
- Asset create and edit forms use wide, grouped dialogs with catalog/location/user dropdowns instead of raw ID fields.
- Location dropdowns are filtered by hierarchy parent where available.
- Dropdown options are deduplicated before rendering.
- Custom fields are rendered as typed inputs from the selected asset type definition.
- Asset detail overview, at-a-glance, maintenance copy, and QR area now prefer readable labels.
- Raw technical identifiers are moved to a secondary technical details panel with shortened IDs.
- QR tab now renders an actual QR image and printable label instead of showing JSON only.
- Shared table search inputs prevent accidental Enter-key form submission.

## Notes

- Backend asset APIs remain unchanged.
- If a role cannot read catalog/location/user reference data, the UI avoids exposing raw UUIDs and shows reference-unavailable labels.
- Exact upload percentage remains outside this change; current upload UX still shows selected file, size, pending state, success/failure, and retry path.
