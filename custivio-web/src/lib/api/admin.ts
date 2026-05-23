import { apiRequest } from "./client";
import type { ApiResult } from "./types";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  jobTitle: string | null;
  tenantId?: string;
  organizationId?: string | null;
  departmentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RoleSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: string;
  permissionKeys: string[];
};

export type RoleAssignmentSummary = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  scopeType: string;
  scopeId: string | null;
};

export type CreateUserRequest = {
  email: string;
  displayName: string;
  password: string;
  organizationId?: string;
  departmentId?: string;
  jobTitle?: string;
};

export type UpdateUserRequest = Partial<
  Pick<CreateUserRequest, "displayName" | "organizationId" | "departmentId" | "jobTitle">
> & {
  status?: "active" | "disabled" | "invited";
};

export type CreateRoleRequest = {
  key: string;
  name: string;
  description?: string;
  permissionKeys: string[];
};

export type UpdateRoleRequest = Partial<Omit<CreateRoleRequest, "key">>;

export type CreateRoleAssignmentRequest = {
  userId: string;
  roleId: string;
  scopeType?: string;
  scopeId?: string;
};

export function listUsers(): Promise<ApiResult<{ users: AdminUser[] }>> {
  return apiRequest({ method: "GET", path: "/api/admin/users" });
}

export function createUser(body: CreateUserRequest): Promise<ApiResult<{ user: AdminUser }>> {
  return apiRequest({ method: "POST", path: "/api/admin/users", body });
}

export function updateUser(
  id: string,
  body: UpdateUserRequest,
): Promise<ApiResult<{ user: AdminUser }>> {
  return apiRequest({
    method: "PATCH",
    path: "/api/admin/users/{id}",
    pathParams: { id },
    body,
  });
}

export function resetUserPassword(
  id: string,
  password: string,
): Promise<ApiResult<{ user: AdminUser }>> {
  return apiRequest({
    method: "POST",
    path: "/api/admin/users/{id}/reset-password",
    pathParams: { id },
    body: { password },
  });
}

export function disableUser(id: string): Promise<ApiResult<{ user: AdminUser }>> {
  return apiRequest({
    method: "POST",
    path: "/api/admin/users/{id}/disable",
    pathParams: { id },
  });
}

export function listRoles(): Promise<ApiResult<{ roles: RoleSummary[] }>> {
  return apiRequest({ method: "GET", path: "/api/admin/roles" });
}

export function createRole(body: CreateRoleRequest): Promise<ApiResult<{ role: RoleSummary }>> {
  return apiRequest({ method: "POST", path: "/api/admin/roles", body });
}

export function updateRole(
  id: string,
  body: UpdateRoleRequest,
): Promise<ApiResult<{ role: RoleSummary }>> {
  return apiRequest({
    method: "PATCH",
    path: "/api/admin/roles/{id}",
    pathParams: { id },
    body,
  });
}

export function listRoleAssignments(): Promise<
  ApiResult<{ assignments: RoleAssignmentSummary[] }>
> {
  return apiRequest({ method: "GET", path: "/api/admin/assignments" });
}

export function createRoleAssignment(
  body: CreateRoleAssignmentRequest,
): Promise<ApiResult<{ assignment: RoleAssignmentSummary }>> {
  return apiRequest({ method: "POST", path: "/api/admin/assignments", body });
}

export function deleteRoleAssignment(
  id: string,
): Promise<ApiResult<{ assignment: RoleAssignmentSummary }>> {
  return apiRequest({
    method: "DELETE",
    path: "/api/admin/assignments/{id}",
    pathParams: { id },
  });
}
