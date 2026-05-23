import { describe, expect, it } from "vitest";
import type { AuthenticatedSession } from "@/lib/api/types";
import {
  ACTION_ACCESS,
  ROUTE_ACCESS,
  SEEDED_ROLE_PERMISSIONS,
  canAccess,
  canAccessRoute,
  canUseAction,
  formatPermissionRequirement,
  type ActionAccessKey,
  type RouteAccessKey,
  type SeededRoleKey,
} from "./permission-policy";

const expectedRoutes: Record<SeededRoleKey, RouteAccessKey[]> = {
  administrator: [
    "dashboard",
    "assets",
    "assetDetail",
    "catalog",
    "stock",
    "custody",
    "maintenance",
    "auditReports",
    "users",
    "roles",
    "assignments",
    "status",
  ],
  asset_manager: [
    "dashboard",
    "assets",
    "assetDetail",
    "catalog",
    "stock",
    "custody",
    "maintenance",
    "status",
  ],
  inventory_clerk: ["dashboard", "assets", "assetDetail", "stock", "custody", "status"],
  technician: ["dashboard", "assets", "assetDetail", "stock", "custody", "maintenance", "status"],
  manager_approver: [
    "dashboard",
    "assets",
    "assetDetail",
    "stock",
    "custody",
    "maintenance",
    "status",
  ],
  auditor: [
    "dashboard",
    "assets",
    "assetDetail",
    "stock",
    "custody",
    "maintenance",
    "auditReports",
    "status",
  ],
  viewer: [
    "dashboard",
    "assets",
    "assetDetail",
    "stock",
    "custody",
    "maintenance",
    "auditReports",
    "status",
  ],
};

const expectedActions: Record<SeededRoleKey, ActionAccessKey[]> = {
  administrator: Object.keys(ACTION_ACCESS) as ActionAccessKey[],
  asset_manager: [
    "assetCreate",
    "assetEdit",
    "assetLifecycle",
    "assetAttachmentUpload",
    "assetAttachmentDownload",
    "assetAttachmentDelete",
    "catalogManage",
    "locationManage",
    "custodyWrite",
    "maintenanceWrite",
    "importWrite",
    "reportWrite",
  ],
  inventory_clerk: ["assetAttachmentDownload", "stockWrite", "importWrite", "reportWrite"],
  technician: ["assetAttachmentDownload", "custodyWrite", "maintenanceWrite"],
  manager_approver: ["assetAttachmentDownload", "custodyWrite", "reportWrite"],
  auditor: ["assetAttachmentDownload", "auditWrite"],
  viewer: ["assetAttachmentDownload"],
};

describe("permission policy", () => {
  it("supports all and any permission checks", () => {
    const session = makeSession("auditor");

    expect(canAccess(session, ["audits.read", "reports.read"])).toBe(true);
    expect(canAccess(session, ["audits.read", "reports.write"])).toBe(false);
    expect(canAccess(session, ["reports.write", "audits.write"], "any")).toBe(true);
    expect(canAccess(null, "assets.read")).toBe(false);
    expect(canAccess(session)).toBe(true);
  });

  it("matches the seeded backend route visibility matrix", () => {
    for (const role of Object.keys(SEEDED_ROLE_PERMISSIONS) as SeededRoleKey[]) {
      const session = makeSession(role);
      const visibleRoutes = Object.keys(ROUTE_ACCESS).filter((route) =>
        canAccessRoute(session, route as RouteAccessKey),
      );

      expect(visibleRoutes).toEqual(expectedRoutes[role]);
    }
  });

  it("matches the seeded backend action visibility matrix", () => {
    for (const role of Object.keys(SEEDED_ROLE_PERMISSIONS) as SeededRoleKey[]) {
      const session = makeSession(role);
      const visibleActions = Object.keys(ACTION_ACCESS).filter((action) =>
        canUseAction(session, action as ActionAccessKey),
      );

      expect(visibleActions).toEqual(expectedActions[role]);
    }
  });

  it("keeps audit and reports hidden for asset managers", () => {
    const session = makeSession("asset_manager");

    expect(canAccessRoute(session, "auditReports")).toBe(false);
    expect(canUseAction(session, "auditWrite")).toBe(false);
    expect(formatPermissionRequirement(ROUTE_ACCESS.auditReports)).toBe(
      "audits.read and imports.read and reports.read",
    );
  });
});

function makeSession(role: SeededRoleKey): AuthenticatedSession {
  return {
    tenant: {
      id: "tenant-1",
      slug: "default",
      name: "Default Tenant",
      status: "active",
    },
    user: {
      id: `${role}-user`,
      email: `${role}@inventory.local`,
      displayName: role,
      status: "active",
    },
    permissionKeys: [...SEEDED_ROLE_PERMISSIONS[role]],
    expiresAt: "2026-05-17T00:00:00.000Z",
  };
}
