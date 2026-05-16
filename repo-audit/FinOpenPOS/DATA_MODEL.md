# FinOpenPOS Data Model

## Tables Found

Drizzle tables in `FinOpenPOS/packages/db/src/schema.ts`:

- `products` (`FinOpenPOS/packages/db/src/schema.ts:32`)
- `customers` (`FinOpenPOS/packages/db/src/schema.ts:51`)
- `orders` (`FinOpenPOS/packages/db/src/schema.ts:62`)
- `order_items` (`FinOpenPOS/packages/db/src/schema.ts:72`)
- `payment_methods` (`FinOpenPOS/packages/db/src/schema.ts:82`)
- `transactions` (`FinOpenPOS/packages/db/src/schema.ts:89`)
- `cities` (`FinOpenPOS/packages/db/src/schema.ts:103`)
- `fiscal_settings` (`FinOpenPOS/packages/db/src/schema.ts:110`)
- `invoices` (`FinOpenPOS/packages/db/src/schema.ts:152`)
- `invoice_items` (`FinOpenPOS/packages/db/src/schema.ts:190`)
- `invoice_events` (`FinOpenPOS/packages/db/src/schema.ts:212`)

## Relations Found

- Order, item, transaction, customer, product, payment method, invoice, invoice item, and invoice event relations are declared with Drizzle relations (`FinOpenPOS/packages/db/src/schema.ts:226`, `FinOpenPOS/packages/db/src/schema.ts:268`).

## Extraction Notes

Useful concepts: product catalog, transactional history, event table pattern, and typed relations. Missing for the target: tenant isolation, asset custody, maintenance, stock ledger, MinIO attachments, Valkey-backed workflows, and enterprise RBAC.

