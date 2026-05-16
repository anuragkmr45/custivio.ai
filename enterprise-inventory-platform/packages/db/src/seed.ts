import { pathToFileURL } from "node:url";

import { getEnv } from "@enterprise-inventory/config";
import { and, eq } from "drizzle-orm";

import { closeDatabaseConnections, getDb } from "./client";
import { auditLogs, tenants } from "./schema";

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
      metadata: { source: "phase-1-seed" },
    });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    await seedDatabase();
  } finally {
    await closeDatabaseConnections();
  }
}
