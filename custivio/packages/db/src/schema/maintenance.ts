import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { assets } from "./assets";
import { createdAtOnly, id, timestamps } from "./common";
import { tenants } from "./tenants";
import { users } from "./users";

export const assetMaintenanceTickets = pgTable(
  "asset_maintenance_tickets",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    openedByUserId: uuid("opened_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 40 }).notNull().default("open"),
    priority: varchar("priority", { length: 40 }).notNull().default("medium"),
    issueSummary: varchar("issue_summary", { length: 500 }).notNull(),
    resolutionSummary: varchar("resolution_summary", { length: 500 }),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    downtimeMinutes: integer("downtime_minutes").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("asset_maintenance_tickets_tenant_asset_idx").on(table.tenantId, table.assetId),
    index("asset_maintenance_tickets_tenant_status_idx").on(table.tenantId, table.status),
    index("asset_maintenance_tickets_tenant_priority_idx").on(table.tenantId, table.priority),
  ],
);

export const assetMaintenanceEvents = pgTable(
  "asset_maintenance_events",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => assetMaintenanceTickets.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    note: varchar("note", { length: 500 }),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    ...createdAtOnly,
  },
  (table) => [
    index("asset_maintenance_events_tenant_ticket_idx").on(table.tenantId, table.ticketId),
    index("asset_maintenance_events_tenant_type_idx").on(table.tenantId, table.eventType),
  ],
);

export const assetWarranties = pgTable(
  "asset_warranties",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 180 }).notNull(),
    contractNumber: varchar("contract_number", { length: 160 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("active"),
    notes: varchar("notes", { length: 500 }),
    ...timestamps,
  },
  (table) => [
    index("asset_warranties_tenant_asset_idx").on(table.tenantId, table.assetId),
    index("asset_warranties_tenant_status_idx").on(table.tenantId, table.status),
    index("asset_warranties_tenant_ends_at_idx").on(table.tenantId, table.endsAt),
  ],
);

export type AssetMaintenanceTicket = typeof assetMaintenanceTickets.$inferSelect;
export type NewAssetMaintenanceTicket = typeof assetMaintenanceTickets.$inferInsert;
export type AssetMaintenanceEvent = typeof assetMaintenanceEvents.$inferSelect;
export type NewAssetMaintenanceEvent = typeof assetMaintenanceEvents.$inferInsert;
export type AssetWarranty = typeof assetWarranties.$inferSelect;
export type NewAssetWarranty = typeof assetWarranties.$inferInsert;
