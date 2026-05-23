import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { authenticateWithPassword } from "@custivio/auth";
import { bootstrapAdmin, findTenantBySlug, getPostgresPool, roleDefinitions } from "@custivio/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

function uniqueSlug(): string {
  return `bootstrap-${randomUUID().slice(0, 8)}`;
}

describe.skipIf(!runDbTests)("production bootstrap admin CLI workflow", () => {
  it("creates the first tenant admin and is idempotent on rerun", async () => {
    const tenantSlug = uniqueSlug();
    const adminEmail = `admin-${randomUUID().slice(0, 8)}@example.com`;

    const firstResult = await bootstrapAdmin({
      tenantSlug,
      tenantName: "Bootstrap Test Tenant",
      adminEmail,
      adminName: "Bootstrap Admin",
      adminPassword: "StrongPassword123",
    });
    const secondResult = await bootstrapAdmin({
      tenantSlug,
      tenantName: "Bootstrap Test Tenant Renamed",
      adminEmail,
      adminName: "Bootstrap Admin Updated",
      adminPassword: "StrongerPassword456",
    });

    expect(firstResult.createdAdminUser).toBe(true);
    expect(secondResult.createdAdminUser).toBe(false);
    expect(secondResult.tenantId).toBe(firstResult.tenantId);
    expect(secondResult.adminUserId).toBe(firstResult.adminUserId);

    const tenant = await findTenantBySlug(tenantSlug);
    expect(tenant?.name).toBe("Bootstrap Test Tenant Renamed");

    const pool = getPostgresPool();
    const tenantUsers = await pool.query<{ display_name: string }>(
      "select display_name from users where tenant_id = $1 and email = $2",
      [firstResult.tenantId, adminEmail],
    );
    const tenantRoles = await pool.query<{ key: string }>(
      "select key from roles where tenant_id = $1",
      [firstResult.tenantId],
    );
    const adminAssignments = await pool.query<{ id: string }>(
      `
        select id
        from user_role_assignments
        where tenant_id = $1
          and user_id = $2
          and scope_type = 'tenant'
      `,
      [firstResult.tenantId, firstResult.adminUserId],
    );
    const bootstrapAuditLogs = await pool.query<{ id: string }>(
      `
        select id
        from audit_logs
        where tenant_id = $1
          and action = 'system.bootstrap_admin'
          and entity_type = 'tenant'
      `,
      [firstResult.tenantId],
    );

    expect(tenantUsers.rows).toHaveLength(1);
    expect(tenantUsers.rows[0]?.display_name).toBe("Bootstrap Admin Updated");
    expect(tenantRoles.rows.map((role) => role.key).sort()).toEqual(
      roleDefinitions.map((role) => role.key).sort(),
    );
    expect(adminAssignments.rows).toHaveLength(1);
    expect(bootstrapAuditLogs.rows).toHaveLength(1);

    const session = await authenticateWithPassword({
      tenantSlug,
      email: adminEmail,
      password: "StrongerPassword456",
      requestId: "bootstrap-admin-login-test",
    });

    expect(session.session.user.email).toBe(adminEmail);
    expect(session.session.permissionKeys).toContain("users.manage");
    expect(session.session.permissionKeys).toContain("roles.manage");
  });
});
