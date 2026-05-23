import type { AuthenticatedSession } from "@/lib/api/types";

export type PermissionRequirement = string | readonly string[];
export type PermissionMode = "all" | "any";

export type PermissionRule = {
  permissions?: PermissionRequirement;
  mode?: PermissionMode;
};

export type RouteAccessKey =
  | "dashboard"
  | "assets"
  | "assetDetail"
  | "catalog"
  | "stock"
  | "custody"
  | "maintenance"
  | "auditReports"
  | "users"
  | "roles"
  | "assignments"
  | "status";

export const ROUTE_ACCESS = {
  dashboard: { permissions: undefined },
  assets: { permissions: "assets.read" },
  assetDetail: { permissions: "assets.read" },
  catalog: { permissions: "catalog.manage" },
  stock: { permissions: "inventory.read" },
  custody: { permissions: "custody.read" },
  maintenance: { permissions: "maintenance.read" },
  auditReports: { permissions: ["audits.read", "imports.read", "reports.read"] },
  users: { permissions: "users.manage" },
  roles: { permissions: "roles.manage" },
  assignments: { permissions: "roles.manage" },
  status: { permissions: undefined },
} as const satisfies Record<RouteAccessKey, PermissionRule>;

export type ActionAccessKey =
  | "assetCreate"
  | "assetEdit"
  | "assetLifecycle"
  | "assetAttachmentUpload"
  | "assetAttachmentDownload"
  | "assetAttachmentDelete"
  | "catalogManage"
  | "locationManage"
  | "stockWrite"
  | "custodyWrite"
  | "maintenanceWrite"
  | "auditWrite"
  | "importWrite"
  | "reportWrite"
  | "userAdmin"
  | "roleAdmin";

export const ACTION_ACCESS = {
  assetCreate: { permissions: "assets.write" },
  assetEdit: { permissions: "assets.write" },
  assetLifecycle: { permissions: "assets.write" },
  assetAttachmentUpload: { permissions: "assets.write" },
  assetAttachmentDownload: { permissions: "assets.read" },
  assetAttachmentDelete: { permissions: "assets.write" },
  catalogManage: { permissions: "catalog.manage" },
  locationManage: { permissions: "locations.manage" },
  stockWrite: { permissions: "inventory.write" },
  custodyWrite: { permissions: "custody.write" },
  maintenanceWrite: { permissions: "maintenance.write" },
  auditWrite: { permissions: "audits.write" },
  importWrite: { permissions: "imports.write" },
  reportWrite: { permissions: "reports.write" },
  userAdmin: { permissions: "users.manage" },
  roleAdmin: { permissions: "roles.manage" },
} as const satisfies Record<ActionAccessKey, PermissionRule>;

export type SeededRoleKey =
  | "administrator"
  | "asset_manager"
  | "inventory_clerk"
  | "technician"
  | "manager_approver"
  | "auditor"
  | "viewer";

export const SEEDED_ROLE_PERMISSIONS = {
  administrator: [
    "tenants.manage",
    "users.manage",
    "roles.manage",
    "locations.manage",
    "catalog.manage",
    "assets.read",
    "assets.write",
    "custody.read",
    "custody.write",
    "maintenance.read",
    "maintenance.write",
    "imports.read",
    "imports.write",
    "inventory.read",
    "inventory.write",
    "audits.read",
    "audits.write",
    "reports.read",
    "reports.write",
  ],
  asset_manager: [
    "locations.manage",
    "catalog.manage",
    "assets.read",
    "assets.write",
    "custody.read",
    "custody.write",
    "maintenance.read",
    "maintenance.write",
    "imports.read",
    "imports.write",
    "inventory.read",
    "reports.read",
    "reports.write",
  ],
  inventory_clerk: [
    "assets.read",
    "custody.read",
    "imports.read",
    "imports.write",
    "inventory.read",
    "inventory.write",
    "reports.read",
    "reports.write",
  ],
  technician: [
    "assets.read",
    "custody.read",
    "custody.write",
    "maintenance.read",
    "maintenance.write",
    "inventory.read",
    "reports.read",
  ],
  manager_approver: [
    "assets.read",
    "custody.read",
    "custody.write",
    "maintenance.read",
    "inventory.read",
    "audits.read",
    "reports.read",
    "reports.write",
  ],
  auditor: [
    "assets.read",
    "custody.read",
    "maintenance.read",
    "imports.read",
    "inventory.read",
    "audits.read",
    "audits.write",
    "reports.read",
  ],
  viewer: [
    "assets.read",
    "custody.read",
    "maintenance.read",
    "imports.read",
    "inventory.read",
    "audits.read",
    "reports.read",
  ],
} as const satisfies Record<SeededRoleKey, readonly string[]>;

export function canAccess(
  session: AuthenticatedSession | null | undefined,
  ruleOrPermissions?: PermissionRule | PermissionRequirement,
  mode: PermissionMode = "all",
): boolean {
  const rule = normalizeRule(ruleOrPermissions, mode);
  if (!rule.permissions) return true;
  if (!session) return false;

  const requiredKeys = Array.isArray(rule.permissions) ? rule.permissions : [rule.permissions];
  if (requiredKeys.length === 0) return true;

  return (rule.mode ?? "all") === "any"
    ? requiredKeys.some((key) => session.permissionKeys.includes(key))
    : requiredKeys.every((key) => session.permissionKeys.includes(key));
}

export function canAccessRoute(
  session: AuthenticatedSession | null | undefined,
  route: RouteAccessKey,
): boolean {
  return canAccess(session, ROUTE_ACCESS[route]);
}

export function canUseAction(
  session: AuthenticatedSession | null | undefined,
  action: ActionAccessKey,
): boolean {
  return canAccess(session, ACTION_ACCESS[action]);
}

export function formatPermissionRequirement(rule: PermissionRule): string {
  if (!rule.permissions) return "Authenticated user";
  const requiredKeys = Array.isArray(rule.permissions) ? rule.permissions : [rule.permissions];
  const joiner = (rule.mode ?? "all") === "any" ? " or " : " and ";
  return requiredKeys.join(joiner);
}

function normalizeRule(
  ruleOrPermissions?: PermissionRule | PermissionRequirement,
  mode: PermissionMode = "all",
): PermissionRule {
  if (!ruleOrPermissions) return {};
  if (typeof ruleOrPermissions === "string" || Array.isArray(ruleOrPermissions)) {
    return { permissions: ruleOrPermissions, mode };
  }
  return ruleOrPermissions as PermissionRule;
}
