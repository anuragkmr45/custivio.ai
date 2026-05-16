# chittyassets Data Model

## Tables Found

Drizzle tables in `chittyassets/shared/schema.ts`:

- `sessions` and `users` (`chittyassets/shared/schema.ts:19`, `chittyassets/shared/schema.ts:30`)
- `assets` (`chittyassets/shared/schema.ts:59`)
- `evidence` (`chittyassets/shared/schema.ts:100`)
- `timeline_events` (`chittyassets/shared/schema.ts:123`)
- `warranties` (`chittyassets/shared/schema.ts:137`)
- `insurance_policies` (`chittyassets/shared/schema.ts:155`)
- `legal_cases` (`chittyassets/shared/schema.ts:177`)
- `ai_analysis_results` (`chittyassets/shared/schema.ts:195`)

## Relations Found

- User and asset relations are declared (`chittyassets/shared/schema.ts:207`, `chittyassets/shared/schema.ts:216`).
- Evidence and timeline relations are declared (`chittyassets/shared/schema.ts:227`, `chittyassets/shared/schema.ts:240`).

## Extraction Notes

Reusable concepts: evidence, timeline events, warranties, and asset stats. Reject AI/blockchain/provider-specific assumptions unless explicitly needed later.

