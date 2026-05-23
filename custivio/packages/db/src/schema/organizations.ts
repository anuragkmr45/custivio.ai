import { index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./common";
import { tenants } from "./tenants";

import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    parentOrganizationId: uuid("parent_organization_id").references(
      (): AnyPgColumn => organizations.id,
      { onDelete: "restrict" },
    ),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    type: varchar("type", { length: 60 }).notNull().default("business_unit"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organizations_tenant_code_unique").on(table.tenantId, table.code),
    index("organizations_tenant_status_idx").on(table.tenantId, table.status),
    index("organizations_parent_idx").on(table.parentOrganizationId),
  ],
);

export const departments = pgTable(
  "departments",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    parentDepartmentId: uuid("parent_department_id").references((): AnyPgColumn => departments.id, {
      onDelete: "restrict",
    }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("departments_tenant_code_unique").on(table.tenantId, table.code),
    index("departments_tenant_org_idx").on(table.tenantId, table.organizationId),
    index("departments_parent_idx").on(table.parentDepartmentId),
  ],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
