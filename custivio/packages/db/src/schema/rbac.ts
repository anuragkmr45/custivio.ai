import { index, pgTable, primaryKey, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { createdAtOnly, id, timestamps } from "./common";
import { tenants } from "./tenants";
import { users } from "./users";

export const permissions = pgTable(
  "permissions",
  {
    ...id,
    key: varchar("key", { length: 120 }).notNull(),
    description: varchar("description", { length: 260 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("permissions_key_unique").on(table.key)],
);

export const roles = pgTable(
  "roles",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: varchar("description", { length: 260 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roles_tenant_key_unique").on(table.tenantId, table.key),
    index("roles_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    ...createdAtOnly,
  },
  (table) => [
    primaryKey({
      name: "role_permissions_pk",
      columns: [table.roleId, table.permissionId],
    }),
    index("role_permissions_tenant_idx").on(table.tenantId),
  ],
);

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    scopeType: varchar("scope_type", { length: 60 }).notNull().default("tenant"),
    scopeId: uuid("scope_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_role_assignments_unique").on(
      table.tenantId,
      table.userId,
      table.roleId,
      table.scopeType,
      table.scopeId,
    ),
    index("user_role_assignments_tenant_user_idx").on(table.tenantId, table.userId),
  ],
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type NewUserRoleAssignment = typeof userRoleAssignments.$inferInsert;
