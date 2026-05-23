import { pathToFileURL } from "node:url";

import { getEnv } from "@custivio/config";
import { and, eq } from "drizzle-orm";

import { closeDatabaseConnections, getDb } from "./client";
import { auditLogs, permissions, rolePermissions, roles, tenants } from "./schema";

export const permissionDefinitions = [
  { key: "tenants.manage", description: "Manage tenant settings" },
  { key: "users.manage", description: "Manage users" },
  { key: "roles.manage", description: "Manage roles and permissions" },
  { key: "locations.manage", description: "Manage locations" },
  { key: "catalog.manage", description: "Manage asset catalog" },
  { key: "assets.read", description: "Read assets" },
  { key: "assets.write", description: "Create and update assets" },
  { key: "custody.read", description: "Read asset custody and transfer records" },
  { key: "custody.write", description: "Manage asset custody and transfer workflows" },
  { key: "maintenance.read", description: "Read warranty and maintenance records" },
  { key: "maintenance.write", description: "Manage warranty and maintenance workflows" },
  { key: "imports.read", description: "Read import jobs and diagnostics" },
  { key: "imports.write", description: "Create and process import jobs" },
  { key: "inventory.read", description: "Read stock and consumables" },
  { key: "inventory.write", description: "Create stock movements" },
  { key: "audits.read", description: "Read audit campaigns and evidence" },
  { key: "audits.write", description: "Run audit campaigns" },
  { key: "reports.read", description: "Read reports and exports" },
  { key: "reports.write", description: "Create reports, exports, and saved filters" },
] as const;

export const roleDefinitions = [
  {
    key: "administrator",
    name: "Administrator",
    description: "Tenant administrator with full local platform access",
    permissions: permissionDefinitions.map((permission) => permission.key),
  },
  {
    key: "asset_manager",
    name: "Asset Manager",
    description: "Manages asset catalog, registry, and lifecycle records",
    permissions: [
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
  },
  {
    key: "inventory_clerk",
    name: "Inventory Clerk",
    description: "Handles stock, consumables, receiving, and issue workflows",
    permissions: [
      "assets.read",
      "custody.read",
      "imports.read",
      "imports.write",
      "inventory.read",
      "inventory.write",
      "reports.read",
      "reports.write",
    ],
  },
  {
    key: "technician",
    name: "Technician",
    description: "Performs maintenance, field checks, and asset handling tasks",
    permissions: [
      "assets.read",
      "custody.read",
      "custody.write",
      "maintenance.read",
      "maintenance.write",
      "inventory.read",
      "reports.read",
    ],
  },
  {
    key: "manager_approver",
    name: "Manager / Approver",
    description: "Reviews operational records and approves custody or transfer decisions",
    permissions: [
      "assets.read",
      "custody.read",
      "custody.write",
      "maintenance.read",
      "inventory.read",
      "audits.read",
      "reports.read",
      "reports.write",
    ],
  },
  {
    key: "auditor",
    name: "Auditor",
    description: "Reviews assets, audits, evidence, and reports",
    permissions: [
      "assets.read",
      "custody.read",
      "maintenance.read",
      "imports.read",
      "inventory.read",
      "audits.read",
      "audits.write",
      "reports.read",
    ],
  },
  {
    key: "viewer",
    name: "Read-only Viewer",
    description: "Reads inventory, asset, audit, and report data without mutation access",
    permissions: [
      "assets.read",
      "custody.read",
      "maintenance.read",
      "imports.read",
      "inventory.read",
      "audits.read",
      "reports.read",
    ],
  },
] as const;

export type SeedRoleKey = (typeof roleDefinitions)[number]["key"];

export async function seedSystemRecordsForTenant(tenantId: string): Promise<void> {
  const db = getDb();

  for (const permissionDefinition of permissionDefinitions) {
    await db
      .insert(permissions)
      .values(permissionDefinition)
      .onConflictDoUpdate({
        target: permissions.key,
        set: {
          description: permissionDefinition.description,
          updatedAt: new Date(),
        },
      });
  }

  const seededPermissions = await db.select().from(permissions);
  const permissionIdByKey = new Map(
    seededPermissions.map((permission) => [permission.key, permission.id]),
  );

  for (const roleDefinition of roleDefinitions) {
    const [role] = await db
      .insert(roles)
      .values({
        tenantId,
        key: roleDefinition.key,
        name: roleDefinition.name,
        description: roleDefinition.description,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [roles.tenantId, roles.key],
        set: {
          name: roleDefinition.name,
          description: roleDefinition.description,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!role) {
      throw new Error(`Failed to seed role: ${roleDefinition.key}`);
    }

    for (const permissionKey of roleDefinition.permissions) {
      const permissionId = permissionIdByKey.get(permissionKey);

      if (!permissionId) {
        throw new Error(`Seed permission is missing: ${permissionKey}`);
      }

      await db
        .insert(rolePermissions)
        .values({
          tenantId,
          roleId: role.id,
          permissionId,
        })
        .onConflictDoNothing({
          target: [rolePermissions.roleId, rolePermissions.permissionId],
        });
    }
  }
}

export async function seedDatabase(): Promise<void> {
  const env = getEnv();
  const db = getDb();

  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: "default",
      name: env.DEV_SEED_TENANT_NAME,
      status: "active",
    })
    .onConflictDoUpdate({
      target: tenants.slug,
      set: {
        name: env.DEV_SEED_TENANT_NAME,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!tenant) {
    throw new Error("Failed to seed default tenant.");
  }

  await seedSystemRecordsForTenant(tenant.id);

  const existingSeedLog = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenant.id),
        eq(auditLogs.action, "system.seed"),
        eq(auditLogs.entityType, "tenant"),
      ),
    )
    .limit(1);

  if (existingSeedLog.length === 0) {
    await db.insert(auditLogs).values({
      tenantId: tenant.id,
      action: "system.seed",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: { source: "phase-2-seed", seededRoles: roleDefinitions.length },
    });
  }
}

async function runSeedCli(): Promise<void> {
  try {
    await seedDatabase();
  } finally {
    await closeDatabaseConnections();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runSeedCli();
}
