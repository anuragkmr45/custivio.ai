import { index, jsonb, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./common";
import { tenants } from "./tenants";

export const assetCategories = pgTable(
  "asset_categories",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: varchar("description", { length: 260 }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("asset_categories_tenant_key_unique").on(table.tenantId, table.key),
    index("asset_categories_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const assetTypes = pgTable(
  "asset_types",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => assetCategories.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    trackingMode: varchar("tracking_mode", { length: 40 }).notNull().default("asset"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("asset_types_tenant_key_unique").on(table.tenantId, table.key),
    index("asset_types_tenant_category_idx").on(table.tenantId, table.categoryId),
  ],
);

export const customFieldDefinitions = pgTable(
  "custom_field_definitions",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    assetTypeId: uuid("asset_type_id")
      .notNull()
      .references(() => assetTypes.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 80 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    fieldType: varchar("field_type", { length: 40 }).notNull(),
    options: jsonb("options"),
    validation: jsonb("validation"),
    required: varchar("required", { length: 8 }).notNull().default("false"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("custom_fields_tenant_type_key_unique").on(
      table.tenantId,
      table.assetTypeId,
      table.key,
    ),
    index("custom_fields_tenant_type_idx").on(table.tenantId, table.assetTypeId),
  ],
);

export const manufacturers = pgTable(
  "manufacturers",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    website: varchar("website", { length: 260 }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("manufacturers_tenant_name_unique").on(table.tenantId, table.name),
    index("manufacturers_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const assetModels = pgTable(
  "asset_models",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    manufacturerId: uuid("manufacturer_id").references(() => manufacturers.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 160 }).notNull(),
    modelNumber: varchar("model_number", { length: 120 }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("asset_models_tenant_name_unique").on(table.tenantId, table.name),
    index("asset_models_tenant_manufacturer_idx").on(table.tenantId, table.manufacturerId),
  ],
);

export const vendors = pgTable(
  "vendors",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    contactEmail: varchar("contact_email", { length: 320 }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vendors_tenant_name_unique").on(table.tenantId, table.name),
    index("vendors_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export type AssetCategory = typeof assetCategories.$inferSelect;
export type NewAssetCategory = typeof assetCategories.$inferInsert;
export type AssetType = typeof assetTypes.$inferSelect;
export type NewAssetType = typeof assetTypes.$inferInsert;
export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;
export type NewCustomFieldDefinition = typeof customFieldDefinitions.$inferInsert;
export type Manufacturer = typeof manufacturers.$inferSelect;
export type NewManufacturer = typeof manufacturers.$inferInsert;
export type AssetModel = typeof assetModels.$inferSelect;
export type NewAssetModel = typeof assetModels.$inferInsert;
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
