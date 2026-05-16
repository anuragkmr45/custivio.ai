# FinOpenPOS Features

## Confirmed

- POS/product inventory: README describes POS and inventory management (`FinOpenPOS/README.md:3`).
- Product CRUD through tRPC (`FinOpenPOS/apps/web/src/lib/trpc/routers/products.ts:25`, `FinOpenPOS/apps/web/src/lib/trpc/routers/products.ts:33`, `FinOpenPOS/apps/web/src/lib/trpc/routers/products.ts:59`, `FinOpenPOS/apps/web/src/lib/trpc/routers/products.ts:88`).
- Customer CRUD (`FinOpenPOS/apps/web/src/lib/trpc/routers/customers.ts:18`, `FinOpenPOS/apps/web/src/lib/trpc/routers/customers.ts:26`, `FinOpenPOS/apps/web/src/lib/trpc/routers/customers.ts:45`, `FinOpenPOS/apps/web/src/lib/trpc/routers/customers.ts:67`).
- Orders and order items (`FinOpenPOS/apps/web/src/lib/trpc/routers/orders.ts:35`, `FinOpenPOS/apps/web/src/lib/trpc/routers/orders.ts:69`, `FinOpenPOS/apps/web/src/lib/trpc/routers/orders.ts:129`).
- Dashboard stats (`FinOpenPOS/apps/web/src/lib/trpc/routers/dashboard.ts:8`).
- Fiscal invoice workflows and QR code generation (`FinOpenPOS/README.md:49`, `FinOpenPOS/apps/web/src/lib/trpc/routers/fiscal.ts:46`, `FinOpenPOS/packages/fiscal/src/qrcode.ts`).
- Strong automated tests (`FinOpenPOS/README.md:308`).

## Not Found

- Enterprise IT asset custody, maintenance tickets, audits, MinIO attachments, Valkey queues/locks, department/site-scoped RBAC.

