import { eq } from "drizzle-orm";

import { getDb } from "../client";
import { tenants, type NewTenant, type Tenant } from "../schema";

export async function createTenant(values: Pick<NewTenant, "slug" | "name">): Promise<Tenant> {
  const [tenant] = await getDb()
    .insert(tenants)
    .values({
      slug: values.slug,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!tenant) {
    throw new Error("Failed to create tenant.");
  }

  return tenant;
}

export async function findTenantBySlug(slug: string): Promise<Tenant | undefined> {
  const [tenant] = await getDb().select().from(tenants).where(eq(tenants.slug, slug)).limit(1);

  return tenant;
}
