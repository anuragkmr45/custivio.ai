import { index, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./common";

export const tenants = pgTable(
  "tenants",
  {
    ...id,
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tenants_slug_unique").on(table.slug),
    index("tenants_status_idx").on(table.status),
  ],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
