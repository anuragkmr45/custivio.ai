import { and, asc, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  permissions,
  rolePermissions,
  roles,
  userRoleAssignments,
  users,
  type NewRole,
  type NewUserRoleAssignment,
  type Permission,
  type Role,
  type UserRoleAssignment,
} from "../schema";

export interface RoleSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  status: string;
  permissionKeys: string[];
}

export interface UserRoleAssignmentSummary {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  scopeType: string;
  scopeId: string | null;
}

export async function findPermissionByKey(key: string): Promise<Permission | undefined> {
  const [permission] = await getDb()
    .select()
    .from(permissions)
    .where(eq(permissions.key, key))
    .limit(1);

  return permission;
}

export async function findRoleByKey(tenantId: string, key: string): Promise<Role | undefined> {
  const [role] = await getDb()
    .select()
    .from(roles)
    .where(and(eq(roles.tenantId, tenantId), eq(roles.key, key)))
    .limit(1);

  return role;
}

export async function findRoleById(tenantId: string, roleId: string): Promise<Role | undefined> {
  const [role] = await getDb()
    .select()
    .from(roles)
    .where(and(eq(roles.tenantId, tenantId), eq(roles.id, roleId)))
    .limit(1);

  return role;
}

export async function createRole(
  values: Pick<NewRole, "tenantId" | "key" | "name" | "description">,
): Promise<Role> {
  const [role] = await getDb()
    .insert(roles)
    .values({
      tenantId: values.tenantId,
      key: values.key,
      name: values.name,
      description: values.description,
      status: "active",
    })
    .returning();

  if (!role) {
    throw new Error("Failed to create role.");
  }

  return role;
}

export async function updateRole(
  tenantId: string,
  roleId: string,
  values: Partial<Pick<NewRole, "key" | "name" | "description" | "status">>,
): Promise<Role | undefined> {
  const [role] = await getDb()
    .update(roles)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(roles.tenantId, tenantId), eq(roles.id, roleId)))
    .returning();

  return role;
}

export async function replaceRolePermissionKeys(
  tenantId: string,
  roleId: string,
  permissionKeys: string[],
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.roleId, roleId)));

    if (permissionKeys.length === 0) {
      return;
    }

    const permissionRows = await tx
      .select()
      .from(permissions)
      .where(eq(permissions.key, permissionKeys[0] ?? ""));

    const allPermissions = await tx.select().from(permissions);
    const permissionIdByKey = new Map(
      allPermissions.map((permission) => [permission.key, permission.id]),
    );

    for (const permissionKey of permissionKeys) {
      const permissionId = permissionIdByKey.get(permissionKey);

      if (!permissionId) {
        throw new Error(`Permission is missing: ${permissionKey}`);
      }

      await tx.insert(rolePermissions).values({
        tenantId,
        roleId,
        permissionId,
      });
    }

    void permissionRows;
  });
}

export async function listRolePermissions(tenantId: string, roleId: string): Promise<Permission[]> {
  const rows = await getDb()
    .select({ permission: permissions })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.roleId, roleId)));

  return rows.map((row) => row.permission);
}

export async function listRolesByTenant(tenantId: string): Promise<Role[]> {
  return getDb()
    .select()
    .from(roles)
    .where(eq(roles.tenantId, tenantId))
    .orderBy(asc(roles.name), asc(roles.key));
}

export async function listRoleSummariesByTenant(tenantId: string): Promise<RoleSummary[]> {
  const roleRows = await listRolesByTenant(tenantId);
  const permissionRows = await getDb()
    .select({
      roleId: rolePermissions.roleId,
      permissionKey: permissions.key,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.tenantId, tenantId))
    .orderBy(asc(permissions.key));

  const permissionKeysByRole = new Map<string, string[]>();

  for (const row of permissionRows) {
    const keys = permissionKeysByRole.get(row.roleId) ?? [];
    keys.push(row.permissionKey);
    permissionKeysByRole.set(row.roleId, keys);
  }

  return roleRows.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    status: role.status,
    permissionKeys: permissionKeysByRole.get(role.id) ?? [],
  }));
}

export async function listUserPermissionKeys(tenantId: string, userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ permissionKey: permissions.key })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoleAssignments.tenantId, tenantId),
        eq(userRoleAssignments.userId, userId),
        eq(roles.status, "active"),
      ),
    )
    .orderBy(asc(permissions.key));

  return [...new Set(rows.map((row) => row.permissionKey))];
}

export async function assignRoleToUser(
  values: Pick<NewUserRoleAssignment, "tenantId" | "userId" | "roleId"> &
    Partial<Pick<NewUserRoleAssignment, "scopeType" | "scopeId">>,
): Promise<UserRoleAssignment> {
  const [assignment] = await getDb()
    .insert(userRoleAssignments)
    .values({
      tenantId: values.tenantId,
      userId: values.userId,
      roleId: values.roleId,
      scopeType: values.scopeType ?? "tenant",
      scopeId: values.scopeId,
    })
    .returning();

  if (!assignment) {
    throw new Error("Failed to assign role to user.");
  }

  return assignment;
}

export async function removeRoleAssignment(
  tenantId: string,
  assignmentId: string,
): Promise<UserRoleAssignment | undefined> {
  const [assignment] = await getDb()
    .delete(userRoleAssignments)
    .where(
      and(eq(userRoleAssignments.tenantId, tenantId), eq(userRoleAssignments.id, assignmentId)),
    )
    .returning();

  return assignment;
}

export async function listUserRoleAssignmentsByTenant(
  tenantId: string,
): Promise<UserRoleAssignmentSummary[]> {
  const rows = await getDb()
    .select({
      id: userRoleAssignments.id,
      userId: users.id,
      userEmail: users.email,
      userDisplayName: users.displayName,
      roleId: roles.id,
      roleKey: roles.key,
      roleName: roles.name,
      scopeType: userRoleAssignments.scopeType,
      scopeId: userRoleAssignments.scopeId,
    })
    .from(userRoleAssignments)
    .innerJoin(users, eq(userRoleAssignments.userId, users.id))
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.tenantId, tenantId))
    .orderBy(asc(users.displayName), asc(roles.name));

  return rows;
}
