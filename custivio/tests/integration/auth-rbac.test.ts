import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import {
  authenticateWithPassword,
  getAuthenticatedSession,
  hashPassword,
  listRolesForSession,
  listUsersForSession,
  logoutSession,
  requirePermission,
  setUserPassword,
  verifyPassword,
} from "@custivio/auth";
import {
  assignRoleToUser,
  createTenant,
  createUser,
  findRoleByKey,
  findTenantBySlug,
  seedDatabase,
  type Tenant,
  type User,
} from "@custivio/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const validPassword = "CorrectHorseBattery1";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.test`;
}

async function getDefaultTenant(): Promise<Tenant> {
  const tenant = await findTenantBySlug("default");

  if (!tenant) {
    throw new Error("Default tenant was not seeded.");
  }

  return tenant;
}

async function createActiveUser(tenantId: string, email = uniqueEmail("auth")): Promise<User> {
  const user = await createUser({
    tenantId,
    email,
    displayName: "Auth Test User",
    status: "active",
  });

  await setUserPassword({
    tenantId,
    userId: user.id,
    password: validPassword,
  });

  return user;
}

async function createAdminUser(): Promise<{ tenant: Tenant; user: User }> {
  const tenant = await getDefaultTenant();
  const user = await createActiveUser(tenant.id, uniqueEmail("admin"));
  const role = await findRoleByKey(tenant.id, "administrator");

  if (!role) {
    throw new Error("Administrator role was not seeded.");
  }

  await assignRoleToUser({
    tenantId: tenant.id,
    userId: user.id,
    roleId: role.id,
  });

  return { tenant, user };
}

describe("password hashing", () => {
  it("verifies only the original password", async () => {
    const hash = await hashPassword(validPassword);

    await expect(verifyPassword(validPassword, hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword123", hash)).resolves.toBe(false);
  });

  it("rejects short passwords", async () => {
    await expect(hashPassword("short")).rejects.toMatchObject({
      code: "invalid_password_policy",
    });
  });
});

describe.skipIf(!runDbTests)("auth, RBAC, and tenant isolation", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("logs in an active tenant user and exposes permission keys", async () => {
    const { tenant, user } = await createAdminUser();
    const result = await authenticateWithPassword({
      tenantSlug: tenant.slug,
      email: user.email,
      password: validPassword,
      requestId: "auth-test-login",
    });

    expect(result.session.tenant.id).toBe(tenant.id);
    expect(result.session.user.id).toBe(user.id);
    expect(result.session.permissionKeys).toContain("users.manage");

    const currentSession = await getAuthenticatedSession(result.sessionToken);
    expect(currentSession?.user.id).toBe(user.id);
    expect(currentSession?.permissionKeys).toContain("roles.manage");

    const users = await listUsersForSession(result.sessionToken);
    expect(users.map((item) => item.id)).toContain(user.id);

    const roles = await listRolesForSession(result.sessionToken);
    expect(roles.map((role) => role.key)).toContain("administrator");
  });

  it("rejects invalid passwords without creating an authenticated session", async () => {
    const tenant = await getDefaultTenant();
    const user = await createActiveUser(tenant.id, uniqueEmail("bad-password"));

    await expect(
      authenticateWithPassword({
        tenantSlug: tenant.slug,
        email: user.email,
        password: "WrongPassword123",
      }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
  });

  it("rejects inactive users", async () => {
    const tenant = await getDefaultTenant();
    const user = await createUser({
      tenantId: tenant.id,
      email: uniqueEmail("inactive"),
      displayName: "Inactive User",
      status: "inactive",
    });

    await setUserPassword({
      tenantId: tenant.id,
      userId: user.id,
      password: validPassword,
    });

    await expect(
      authenticateWithPassword({
        tenantSlug: tenant.slug,
        email: user.email,
        password: validPassword,
      }),
    ).rejects.toMatchObject({ code: "inactive_user" });
  });

  it("denies permissions by default for users without grants", async () => {
    const tenant = await createTenant({
      slug: `tenant-${randomUUID().slice(0, 8)}`,
      name: "No Grant Tenant",
    });
    const user = await createActiveUser(tenant.id, uniqueEmail("no-grant"));
    const result = await authenticateWithPassword({
      tenantSlug: tenant.slug,
      email: user.email,
      password: validPassword,
    });

    await expect(requirePermission(result.sessionToken, "users.manage")).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("revokes sessions on logout", async () => {
    const { tenant, user } = await createAdminUser();
    const result = await authenticateWithPassword({
      tenantSlug: tenant.slug,
      email: user.email,
      password: validPassword,
    });

    await logoutSession(result.sessionToken, "auth-test-logout");

    await expect(getAuthenticatedSession(result.sessionToken)).resolves.toBeUndefined();
  });

  it("keeps same-email users tenant-scoped", async () => {
    const email = uniqueEmail("tenant-scope");
    const defaultTenant = await getDefaultTenant();
    const otherTenant = await createTenant({
      slug: `scope-${randomUUID().slice(0, 8)}`,
      name: "Scoped Tenant",
    });
    const defaultUser = await createActiveUser(defaultTenant.id, email);
    const otherUser = await createActiveUser(otherTenant.id, email);

    const defaultLogin = await authenticateWithPassword({
      tenantSlug: defaultTenant.slug,
      email,
      password: validPassword,
    });
    const otherLogin = await authenticateWithPassword({
      tenantSlug: otherTenant.slug,
      email,
      password: validPassword,
    });

    expect(defaultLogin.session.user.id).toBe(defaultUser.id);
    expect(otherLogin.session.user.id).toBe(otherUser.id);
  });
});
