import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { assets } from "./assets";
import { id, timestamps } from "./common";
import { tenants } from "./tenants";
import { users } from "./users";

export const assetCustodyAssignments = pgTable(
  "asset_custody_assignments",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    assignedToUserId: uuid("assigned_to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    status: varchar("status", { length: 40 }).notNull().default("active"),
    notes: varchar("notes", { length: 500 }),
    ...timestamps,
  },
  (table) => [
    index("asset_custody_tenant_asset_idx").on(table.tenantId, table.assetId),
    index("asset_custody_tenant_user_idx").on(table.tenantId, table.assignedToUserId),
    index("asset_custody_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const assetTransferRequests = pgTable(
  "asset_transfer_requests",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    fromCustodianUserId: uuid("from_custodian_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    toCustodianUserId: uuid("to_custodian_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    requestedByUserId: uuid("requested_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 40 }).notNull().default("pending"),
    reason: varchar("reason", { length: 500 }),
    decisionNote: varchar("decision_note", { length: 500 }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("asset_transfers_tenant_asset_idx").on(table.tenantId, table.assetId),
    index("asset_transfers_tenant_status_idx").on(table.tenantId, table.status),
    index("asset_transfers_tenant_to_user_idx").on(table.tenantId, table.toCustodianUserId),
  ],
);

export type AssetCustodyAssignment = typeof assetCustodyAssignments.$inferSelect;
export type NewAssetCustodyAssignment = typeof assetCustodyAssignments.$inferInsert;
export type AssetTransferRequest = typeof assetTransferRequests.$inferSelect;
export type NewAssetTransferRequest = typeof assetTransferRequests.$inferInsert;
