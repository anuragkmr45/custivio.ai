import { index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./common";
import { departments, organizations } from "./organizations";
import { tenants } from "./tenants";

export const users = pgTable(
  "users",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    jobTitle: varchar("job_title", { length: 120 }),
    status: varchar("status", { length: 32 }).notNull().default("inactive"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_tenant_email_unique").on(table.tenantId, table.email),
    index("users_tenant_status_idx").on(table.tenantId, table.status),
    index("users_tenant_org_idx").on(table.tenantId, table.organizationId),
    index("users_tenant_department_idx").on(table.tenantId, table.departmentId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
