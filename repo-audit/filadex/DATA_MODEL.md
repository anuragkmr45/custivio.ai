# filadex Data Model

## Tables Found

Drizzle tables in `filadex/shared/schema.ts`:

- `users` (`filadex/shared/schema.ts:5`)
- `filaments` (`filadex/shared/schema.ts:18`)
- `manufacturers` (`filadex/shared/schema.ts:81`)
- `materials` (`filadex/shared/schema.ts:88`)
- `colors` (`filadex/shared/schema.ts:95`)
- `diameters` (`filadex/shared/schema.ts:102`)
- `storage_locations` (`filadex/shared/schema.ts:108`)
- `user_sharing` (`filadex/shared/schema.ts:166`)

## Extraction Notes

Useful patterns: inventory item attributes, reference tables, storage locations, and public sharing model. Missing: tenant isolation, hardware asset identifiers, custody, audit logs, maintenance, stock ledger, MinIO metadata, enterprise RBAC.

