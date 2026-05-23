# User Guide

## Main Workflows

- Dashboard: confirms tenant context and signed-in user.
- Catalog: manages controlled values such as categories, types, manufacturers, models, vendors, and
  custom fields.
- Assets: registers fixed assets, identifiers, attachments, and lifecycle events.
- Stock: manages consumable stock items, units, receive/issue movements, and low-stock review.
- Custody: checks assets out, hands assets over, checks assets in, and manages transfer decisions.
- Maintenance: opens tickets, resolves work, and records warranties.
- Audit & Reports: creates audit campaigns, records scan findings, previews imports, runs exports,
  and saves report filters.

## Good Data Practices

- Use unique asset tags and serial numbers.
- Attach evidence to asset and audit records instead of storing files outside the platform.
- Record custody and maintenance events when they happen.
- Use imports for bulk onboarding, then review row diagnostics before processing.

## Error Handling

Each server error includes a request ID. Give that request ID to an administrator when reporting an
issue.
