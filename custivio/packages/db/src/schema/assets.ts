import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { assetModels, assetTypes, vendors } from "./asset-catalog";
import { id, timestamps } from "./common";
import { bins, buildings, floors, racks, rooms, shelves, sites } from "./locations";
import { tenants } from "./tenants";
import { users } from "./users";

export const assets = pgTable(
  "assets",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetTypeId: uuid("asset_type_id")
      .notNull()
      .references(() => assetTypes.id, { onDelete: "restrict" }),
    modelId: uuid("model_id").references(() => assetModels.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
    buildingId: uuid("building_id").references(() => buildings.id, { onDelete: "set null" }),
    floorId: uuid("floor_id").references(() => floors.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    rackId: uuid("rack_id").references(() => racks.id, { onDelete: "set null" }),
    shelfId: uuid("shelf_id").references(() => shelves.id, { onDelete: "set null" }),
    binId: uuid("bin_id").references(() => bins.id, { onDelete: "set null" }),
    custodianUserId: uuid("custodian_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assetTag: varchar("asset_tag", { length: 120 }).notNull(),
    serialNumber: varchar("serial_number", { length: 160 }),
    name: varchar("name", { length: 180 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("in_stock"),
    condition: varchar("condition", { length: 40 }).notNull().default("good"),
    customFields: jsonb("custom_fields")
      .notNull()
      .default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("assets_tenant_asset_tag_unique").on(table.tenantId, table.assetTag),
    uniqueIndex("assets_tenant_serial_unique").on(table.tenantId, table.serialNumber),
    index("assets_tenant_status_idx").on(table.tenantId, table.status),
    index("assets_tenant_type_idx").on(table.tenantId, table.assetTypeId),
    index("assets_tenant_location_idx").on(table.tenantId, table.siteId, table.roomId, table.binId),
    index("assets_tenant_custodian_idx").on(table.tenantId, table.custodianUserId),
  ],
);

export const assetIdentifiers = pgTable(
  "asset_identifiers",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    identifierType: varchar("identifier_type", { length: 80 }).notNull(),
    identifierValue: varchar("identifier_value", { length: 180 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("asset_identifiers_tenant_type_value_unique").on(
      table.tenantId,
      table.identifierType,
      table.identifierValue,
    ),
    index("asset_identifiers_tenant_asset_idx").on(table.tenantId, table.assetId),
  ],
);

export const assetAttachments = pgTable(
  "asset_attachments",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    objectKey: varchar("object_key", { length: 520 }).notNull(),
    filename: varchar("filename", { length: 260 }).notNull(),
    contentType: varchar("content_type", { length: 160 }).notNull(),
    contentLength: integer("content_length"),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("asset_attachments_object_key_unique").on(table.objectKey),
    index("asset_attachments_tenant_asset_idx").on(table.tenantId, table.assetId),
    index("asset_attachments_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const assetLifecycleEvents = pgTable(
  "asset_lifecycle_events",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    fromStatus: varchar("from_status", { length: 40 }),
    toStatus: varchar("to_status", { length: 40 }),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("asset_lifecycle_events_tenant_asset_idx").on(table.tenantId, table.assetId),
    index("asset_lifecycle_events_tenant_type_idx").on(table.tenantId, table.eventType),
  ],
);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AssetIdentifier = typeof assetIdentifiers.$inferSelect;
export type NewAssetIdentifier = typeof assetIdentifiers.$inferInsert;
export type AssetAttachment = typeof assetAttachments.$inferSelect;
export type NewAssetAttachment = typeof assetAttachments.$inferInsert;
export type AssetLifecycleEvent = typeof assetLifecycleEvents.$inferSelect;
export type NewAssetLifecycleEvent = typeof assetLifecycleEvents.$inferInsert;
