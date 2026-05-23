import { describe, expect, it } from "vitest";
import { getDisplayInitials, hasAnyPermission, hasPermission } from "./auth";
import type { AuthenticatedSession } from "./api/types";

const session: AuthenticatedSession = {
  tenant: {
    id: "tenant-1",
    slug: "default",
    name: "Default Tenant",
    status: "active",
  },
  user: {
    id: "user-1",
    email: "admin@custivio.example.test",
    displayName: "UAT Administrator",
    status: "active",
  },
  permissionKeys: ["assets.read", "assets.write", "users.manage"],
  expiresAt: "2026-05-17T00:00:00.000Z",
};

describe("auth helpers", () => {
  it("checks single and combined permissions", () => {
    expect(hasPermission(session, "assets.read")).toBe(true);
    expect(hasPermission(session, ["assets.read", "assets.write"])).toBe(true);
    expect(hasPermission(session, ["assets.read", "roles.manage"])).toBe(false);
    expect(hasPermission(null, "assets.read")).toBe(false);
    expect(hasPermission(session)).toBe(true);
  });

  it("checks any-of permissions for combined pages", () => {
    expect(hasAnyPermission(session, ["roles.manage", "assets.read"])).toBe(true);
    expect(hasAnyPermission(session, ["roles.manage", "catalog.manage"])).toBe(false);
    expect(hasAnyPermission(null, ["assets.read", "users.manage"])).toBe(false);
    expect(hasAnyPermission(session)).toBe(true);
  });

  it("derives display initials from backend session", () => {
    expect(getDisplayInitials(session)).toBe("UA");
    expect(getDisplayInitials({ ...session, user: { ...session.user, displayName: "" } })).toBe(
      "AC",
    );
    expect(getDisplayInitials(null)).toBe("U");
  });
});
