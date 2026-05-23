import { index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./common";
import { tenants } from "./tenants";

export const sites = pgTable(
  "sites",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sites_tenant_code_unique").on(table.tenantId, table.code),
    index("sites_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const buildings = pgTable(
  "buildings",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("buildings_tenant_site_code_unique").on(table.tenantId, table.siteId, table.code),
    index("buildings_tenant_site_idx").on(table.tenantId, table.siteId),
  ],
);

export const floors = pgTable(
  "floors",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => buildings.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("floors_tenant_building_code_unique").on(
      table.tenantId,
      table.buildingId,
      table.code,
    ),
    index("floors_tenant_building_idx").on(table.tenantId, table.buildingId),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    floorId: uuid("floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("rooms_tenant_floor_code_unique").on(table.tenantId, table.floorId, table.code),
    index("rooms_tenant_floor_idx").on(table.tenantId, table.floorId),
  ],
);

export const racks = pgTable(
  "racks",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("racks_tenant_room_code_unique").on(table.tenantId, table.roomId, table.code),
    index("racks_tenant_room_idx").on(table.tenantId, table.roomId),
  ],
);

export const shelves = pgTable(
  "shelves",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    rackId: uuid("rack_id")
      .notNull()
      .references(() => racks.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("shelves_tenant_rack_code_unique").on(table.tenantId, table.rackId, table.code),
    index("shelves_tenant_rack_idx").on(table.tenantId, table.rackId),
  ],
);

export const bins = pgTable(
  "bins",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    shelfId: uuid("shelf_id").references(() => shelves.id, { onDelete: "restrict" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("bins_tenant_code_unique").on(table.tenantId, table.code),
    index("bins_tenant_shelf_idx").on(table.tenantId, table.shelfId),
    index("bins_tenant_room_idx").on(table.tenantId, table.roomId),
  ],
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Building = typeof buildings.$inferSelect;
export type NewBuilding = typeof buildings.$inferInsert;
export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Rack = typeof racks.$inferSelect;
export type NewRack = typeof racks.$inferInsert;
export type Shelf = typeof shelves.$inferSelect;
export type NewShelf = typeof shelves.$inferInsert;
export type Bin = typeof bins.$inferSelect;
export type NewBin = typeof bins.$inferInsert;
