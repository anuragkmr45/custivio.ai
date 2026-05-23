import {
  appendAuditLog,
  assignRoleToUser,
  createRole,
  createUser,
  findRoleById,
  findUserById,
  removeRoleAssignment,
  replaceRolePermissionKeys,
  updateRole,
  updateUser,
  type Role,
  type User,
  type UserRoleAssignment,
} from "@custivio/db";

import { AuthError } from "./errors";
import { requirePermission, setUserPassword } from "./sessions";

function readString(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(input: Record<string, unknown>, key: string): string | undefined {
  const value = readString(input, key);

  return value.length > 0 ? value : undefined;
}

function requireString(input: Record<string, unknown>, key: string): string {
  const value = readString(input, key);

  if (value.length === 0) {
    throw new AuthError("invalid_admin_input", `${key} is required.`, 400);
  }

  return value;
}

function readPermissionKeys(input: Record<string, unknown>): string[] {
  const value = input.permissionKeys;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((permission): permission is string => typeof permission === "string");
}

async function writeAdminAudit(
  tenantId: string,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  requestId?: string,
): Promise<void> {
  await appendAuditLog({
    tenantId,
    actorUserId,
    action,
    entityType,
    entityId,
    requestId,
  });
}

export async function createUserForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<User> {
  const session = await requirePermission(sessionToken, "users.manage");
  const values: Parameters<typeof createUser>[0] = {
    tenantId: session.tenant.id,
    email: requireString(input, "email"),
    displayName: requireString(input, "displayName"),
    status: readOptionalString(input, "status") ?? "inactive",
  };
  const organizationId = readOptionalString(input, "organizationId");
  const departmentId = readOptionalString(input, "departmentId");
  const jobTitle = readOptionalString(input, "jobTitle");

  if (organizationId) values.organizationId = organizationId;
  if (departmentId) values.departmentId = departmentId;
  if (jobTitle) values.jobTitle = jobTitle;

  const user = await createUser(values);
  const password = readOptionalString(input, "password");

  if (password) {
    await setUserPassword({ tenantId: session.tenant.id, userId: user.id, password });
  }

  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.user_created",
    "user",
    user.id,
    requestId,
  );

  return user;
}

export async function updateUserForSession(
  sessionToken: string | undefined,
  userId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<User> {
  const session = await requirePermission(sessionToken, "users.manage");
  const patch: Parameters<typeof updateUser>[2] = {};
  const email = readOptionalString(input, "email");
  const displayName = readOptionalString(input, "displayName");
  const organizationId = readOptionalString(input, "organizationId");
  const departmentId = readOptionalString(input, "departmentId");
  const jobTitle = readOptionalString(input, "jobTitle");
  const status = readOptionalString(input, "status");

  if (email) patch.email = email;
  if (displayName) patch.displayName = displayName;
  if (organizationId) patch.organizationId = organizationId;
  if (departmentId) patch.departmentId = departmentId;
  if (jobTitle) patch.jobTitle = jobTitle;
  if (status) patch.status = status;

  const user = await updateUser(session.tenant.id, userId, patch);

  if (!user) {
    throw new AuthError("user_not_found", "User was not found.", 404);
  }

  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.user_updated",
    "user",
    user.id,
    requestId,
  );

  return user;
}

export async function resetUserPasswordForSession(
  sessionToken: string | undefined,
  userId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<{ userId: string; reset: true }> {
  const session = await requirePermission(sessionToken, "users.manage");
  const user = await findUserById(session.tenant.id, userId);

  if (!user) {
    throw new AuthError("user_not_found", "User was not found.", 404);
  }

  await setUserPassword({
    tenantId: session.tenant.id,
    userId: user.id,
    password: requireString(input, "password"),
  });
  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.password_reset",
    "user",
    user.id,
    requestId,
  );

  return { userId: user.id, reset: true };
}

export async function disableUserForSession(
  sessionToken: string | undefined,
  userId: string,
  requestId?: string,
): Promise<User> {
  return updateUserForSession(sessionToken, userId, { status: "inactive" }, requestId);
}

export async function createRoleForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<Role> {
  const session = await requirePermission(sessionToken, "roles.manage");
  const role = await createRole({
    tenantId: session.tenant.id,
    key: requireString(input, "key"),
    name: requireString(input, "name"),
    description: requireString(input, "description"),
  });
  const permissionKeys = readPermissionKeys(input);

  if (permissionKeys.length > 0) {
    await replaceRolePermissionKeys(session.tenant.id, role.id, permissionKeys);
  }

  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.role_created",
    "role",
    role.id,
    requestId,
  );

  return role;
}

export async function updateRoleForSession(
  sessionToken: string | undefined,
  roleId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<Role> {
  const session = await requirePermission(sessionToken, "roles.manage");
  const patch: Parameters<typeof updateRole>[2] = {};
  const key = readOptionalString(input, "key");
  const name = readOptionalString(input, "name");
  const description = readOptionalString(input, "description");
  const status = readOptionalString(input, "status");

  if (key) patch.key = key;
  if (name) patch.name = name;
  if (description) patch.description = description;
  if (status) patch.status = status;

  const role = await updateRole(session.tenant.id, roleId, patch);

  if (!role) {
    throw new AuthError("role_not_found", "Role was not found.", 404);
  }

  if (Array.isArray(input.permissionKeys)) {
    await replaceRolePermissionKeys(session.tenant.id, role.id, readPermissionKeys(input));
  }

  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.role_updated",
    "role",
    role.id,
    requestId,
  );

  return role;
}

export async function assignRoleForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<UserRoleAssignment> {
  const session = await requirePermission(sessionToken, "roles.manage");
  const userId = requireString(input, "userId");
  const roleId = requireString(input, "roleId");
  const [user, role] = await Promise.all([
    findUserById(session.tenant.id, userId),
    findRoleById(session.tenant.id, roleId),
  ]);

  if (!user) {
    throw new AuthError("user_not_found", "User was not found.", 404);
  }

  if (!role) {
    throw new AuthError("role_not_found", "Role was not found.", 404);
  }

  const assignmentInput: Parameters<typeof assignRoleToUser>[0] = {
    tenantId: session.tenant.id,
    userId,
    roleId,
    scopeType: readOptionalString(input, "scopeType") ?? "tenant",
  };
  const scopeId = readOptionalString(input, "scopeId");

  if (scopeId) assignmentInput.scopeId = scopeId;

  const assignment = await assignRoleToUser(assignmentInput);

  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.role_assigned",
    "user_role_assignment",
    assignment.id,
    requestId,
  );

  return assignment;
}

export async function removeRoleAssignmentForSession(
  sessionToken: string | undefined,
  assignmentId: string,
  requestId?: string,
): Promise<UserRoleAssignment> {
  const session = await requirePermission(sessionToken, "roles.manage");
  const assignment = await removeRoleAssignment(session.tenant.id, assignmentId);

  if (!assignment) {
    throw new AuthError("assignment_not_found", "Role assignment was not found.", 404);
  }

  await writeAdminAudit(
    session.tenant.id,
    session.user.id,
    "admin.role_removed",
    "user_role_assignment",
    assignment.id,
    requestId,
  );

  return assignment;
}
