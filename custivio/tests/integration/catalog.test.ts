import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { authenticateWithPassword, setUserPassword } from "@custivio/auth";
import { archiveCatalogResource, createCatalogResource, listCatalogOverview } from "@custivio/core";
import {
  assignRoleToUser,
  createAsset,
  createUser,
  findRoleByKey,
  findTenantBySlug,
  listAuditLogsForEntity,
  seedDatabase,
  type Tenant,
  type User,
} from "@custivio/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const validPassword = "CorrectHorseBattery1";

function uniqueKey(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

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

async function createActiveUser(tenantId: string, email = uniqueEmail("catalog")): Promise<User> {
  const user = await createUser({
    tenantId,
    email,
    displayName: "Catalog Test User",
    status: "active",
  });

  await setUserPassword({
    tenantId,
    userId: user.id,
    password: validPassword,
  });

  return user;
}

async function createAdminSession(): Promise<{ token: string; tenant: Tenant; user: User }> {
  const tenant = await getDefaultTenant();
  const user = await createActiveUser(tenant.id, uniqueEmail("catalog-admin"));
  const role = await findRoleByKey(tenant.id, "administrator");

  if (!role) {
    throw new Error("Administrator role was not seeded.");
  }

  await assignRoleToUser({
    tenantId: tenant.id,
    userId: user.id,
    roleId: role.id,
  });

  const login = await authenticateWithPassword({
    tenantSlug: tenant.slug,
    email: user.email,
    password: validPassword,
  });

  return { token: login.sessionToken, tenant, user };
}

describe.skipIf(!runDbTests)("asset catalog services", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("creates catalog records and writes audit logs", async () => {
    const { token, tenant } = await createAdminSession();
    const category = await createCatalogResource(token, "categories", {
      key: uniqueKey("hardware"),
      name: "Hardware",
      description: "Managed hardware",
    });

    const logs = await listAuditLogsForEntity(tenant.id, "asset_category", category.id);

    expect(logs.map((log) => log.action)).toContain("catalog.category_created");

    const overview = await listCatalogOverview(token);
    expect(overview.categories.map((item) => item.id)).toContain(category.id);
  });

  it("rejects duplicate category keys per tenant", async () => {
    const { token } = await createAdminSession();
    const key = uniqueKey("duplicate");

    await createCatalogResource(token, "categories", {
      key,
      name: "Original",
    });

    await expect(
      createCatalogResource(token, "categories", {
        key,
        name: "Duplicate",
      }),
    ).rejects.toThrow();
  });

  it("validates select custom field choices", async () => {
    const { token } = await createAdminSession();
    const category = await createCatalogResource(token, "categories", {
      key: uniqueKey("category"),
      name: "Category",
    });
    const assetType = await createCatalogResource(token, "types", {
      categoryId: category.id,
      key: uniqueKey("type"),
      name: "Laptop",
      trackingMode: "asset",
    });

    await expect(
      createCatalogResource(token, "custom-fields", {
        assetTypeId: assetType.id,
        key: uniqueKey("field"),
        label: "CPU",
        fieldType: "select",
      }),
    ).rejects.toMatchObject({ code: "invalid_catalog_input" });
  });

  it("blocks archiving categories while asset types use them", async () => {
    const { token } = await createAdminSession();
    const category = await createCatalogResource(token, "categories", {
      key: uniqueKey("protected-category"),
      name: "Protected Category",
    });

    await createCatalogResource(token, "types", {
      categoryId: category.id,
      key: uniqueKey("protected-type"),
      name: "Protected Type",
      trackingMode: "asset",
    });

    await expect(archiveCatalogResource(token, "categories", category.id)).rejects.toMatchObject({
      code: "catalog_record_in_use",
    });
  });

  it("blocks archiving asset types while assets use them", async () => {
    const { token, tenant } = await createAdminSession();
    const category = await createCatalogResource(token, "categories", {
      key: uniqueKey("asset-category"),
      name: "Asset Category",
    });
    const assetType = await createCatalogResource(token, "types", {
      categoryId: category.id,
      key: uniqueKey("asset-type"),
      name: "Asset Type",
      trackingMode: "asset",
    });

    await createAsset({
      tenantId: tenant.id,
      assetTypeId: assetType.id,
      assetTag: uniqueKey("asset"),
      name: "Assigned Asset",
    });

    await expect(archiveCatalogResource(token, "types", assetType.id)).rejects.toMatchObject({
      code: "catalog_record_in_use",
    });
  });
});
