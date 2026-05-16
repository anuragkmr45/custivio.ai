# ce Data Model

## Representative Tables Found

The schema is broad; representative Drizzle tables include:

- `assets` (`ce/apps/backend/src/db/schema/assets.schema.ts:6`)
- `users` (`ce/apps/backend/src/db/schema/users.schema.ts:3`)
- `projects` (`ce/apps/backend/src/db/schema/projects.schema.ts:17`)
- `project_permissions` and `project_group_permissions` (`ce/apps/backend/src/db/schema/project-permissions.schema.ts:6`, `ce/apps/backend/src/db/schema/project-permissions.schema.ts:27`)
- `pending_uploads` (`ce/apps/backend/src/db/schema/pending-uploads.schema.ts:36`)
- `pipeline_schemas`, `pipeline_data`, and embeddings (`ce/apps/backend/src/db/schema/pipeline-schemas.schema.ts:39`, `ce/apps/backend/src/db/schema/pipeline-data.schema.ts:10`, `ce/apps/backend/src/db/schema/pipeline-data-embeddings.schema.ts:38`)
- `api_keys`, `share_links`, `retention_rules`, `cache_rules` (`ce/apps/backend/src/db/schema/api-keys.schema.ts:5`, `ce/apps/backend/src/db/schema/share-links.schema.ts:16`, `ce/apps/backend/src/db/schema/retention-rules.schema.ts:19`, `ce/apps/backend/src/db/schema/cache-rules.schema.ts:18`)

## Extraction Notes

Useful concepts: project-scoped permissions, upload metadata, storage adapters, retention/cache rules, API keys, and health/documentation conventions. Domain tables are not IT asset inventory tables.

