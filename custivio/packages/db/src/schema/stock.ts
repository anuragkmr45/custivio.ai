import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps, createdAtOnly } from "./common";
import { tenants } from "./tenants";
import { users } from "./users";

export const stockUnits = pgTable(
  "stock_units",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stock_units_tenant_code_unique").on(table.tenantId, table.code),
    index("stock_units_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const stockItems = pgTable(
  "stock_items",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => stockUnits.id, { onDelete: "restrict" }),
    sku: varchar("sku", { length: 120 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    itemType: varchar("item_type", { length: 60 }).notNull().default("consumable"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stock_items_tenant_sku_unique").on(table.tenantId, table.sku),
    index("stock_items_tenant_status_idx").on(table.tenantId, table.status),
    index("stock_items_tenant_type_idx").on(table.tenantId, table.itemType),
  ],
);

export const stockBalances = pgTable(
  "stock_balances",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "restrict" }),
    locationKey: varchar("location_key", { length: 120 }).notNull().default("default"),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stock_balances_tenant_item_location_unique").on(
      table.tenantId,
      table.stockItemId,
      table.locationKey,
    ),
    index("stock_balances_tenant_item_idx").on(table.tenantId, table.stockItemId),
  ],
);

export const stockLedgerEntries = pgTable(
  "stock_ledger_entries",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "restrict" }),
    movementType: varchar("movement_type", { length: 40 }).notNull(),
    quantity: integer("quantity").notNull(),
    fromLocationKey: varchar("from_location_key", { length: 120 }),
    toLocationKey: varchar("to_location_key", { length: 120 }),
    referenceId: varchar("reference_id", { length: 160 }),
    idempotencyKey: varchar("idempotency_key", { length: 160 }),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...createdAtOnly,
  },
  (table) => [
    index("stock_ledger_tenant_item_idx").on(table.tenantId, table.stockItemId),
    index("stock_ledger_tenant_type_idx").on(table.tenantId, table.movementType),
    uniqueIndex("stock_ledger_tenant_idempotency_unique").on(table.tenantId, table.idempotencyKey),
  ],
);

export const stockAdjustments = pgTable(
  "stock_adjustments",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "restrict" }),
    locationKey: varchar("location_key", { length: 120 }).notNull().default("default"),
    quantityDelta: integer("quantity_delta").notNull(),
    reason: varchar("reason", { length: 240 }).notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...createdAtOnly,
  },
  (table) => [index("stock_adjustments_tenant_item_idx").on(table.tenantId, table.stockItemId)],
);

export const stockTransfers = pgTable(
  "stock_transfers",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    fromLocationKey: varchar("from_location_key", { length: 120 }).notNull(),
    toLocationKey: varchar("to_location_key", { length: 120 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("completed"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [index("stock_transfers_tenant_item_idx").on(table.tenantId, table.stockItemId)],
);

export const stockLowStockRules = pgTable(
  "stock_low_stock_rules",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "cascade" }),
    locationKey: varchar("location_key", { length: 120 }).notNull().default("default"),
    threshold: integer("threshold").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stock_low_rules_tenant_item_location_unique").on(
      table.tenantId,
      table.stockItemId,
      table.locationKey,
    ),
  ],
);

export type StockUnit = typeof stockUnits.$inferSelect;
export type NewStockUnit = typeof stockUnits.$inferInsert;
export type StockItem = typeof stockItems.$inferSelect;
export type NewStockItem = typeof stockItems.$inferInsert;
export type StockBalance = typeof stockBalances.$inferSelect;
export type NewStockBalance = typeof stockBalances.$inferInsert;
export type StockLedgerEntry = typeof stockLedgerEntries.$inferSelect;
export type NewStockLedgerEntry = typeof stockLedgerEntries.$inferInsert;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;
export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;
export type StockLowStockRule = typeof stockLowStockRules.$inferSelect;
export type NewStockLowStockRule = typeof stockLowStockRules.$inferInsert;
