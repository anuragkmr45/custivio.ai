import { randomUUID } from "node:crypto";

import { describe, expect, it, beforeAll } from "vitest";

import {
  appendAuditLog,
  createAsset,
  createAssetCategory,
  createAssetModel,
  createBuilding,
  createFloor,
  createManufacturer,
  createOrganization,
  createRoom,
  createSite,
  createTenant,
  createAssetType,
  findAssetByTag,
  findRoleByKey,
  findTenantBySlug,
  listAuditLogsForEntity,
  listOrganizationsByTenant,
  listRolePermissions,
  seedDatabase,
} from "@custivio/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

function uniqueKey(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function createTenantForTest() {
  return createTenant({
    slug: uniqueKey("tenant"),
    name: "Integration Test Tenant",
  });
}

async function createAssetTypeForTest(tenantId: string) {
  const category = await createAssetCategory({
    tenantId,
    key: uniqueKey("hardware"),
    name: "Hardware",
  });

  return createAssetType({
    tenantId,
    categoryId: category.id,
    key: uniqueKey("laptop"),
    name: "Laptop",
  });
}

describe.skipIf(!runDbTests)("database foundation", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("seeds default tenant roles and permissions idempotently", async () => {
    await seedDatabase();
    await seedDatabase();

    const tenant = await findTenantBySlug("default");
    expect(tenant).toBeDefined();

    const administrator = await findRoleByKey(tenant!.id, "administrator");
    expect(administrator).toBeDefined();

    const rolePermissions = await listRolePermissions(tenant!.id, administrator!.id);
    expect(rolePermissions.map((permission) => permission.key)).toContain("assets.write");
    expect(rolePermissions.map((permission) => permission.key)).toContain("roles.manage");
  });

  it("keeps organization repository reads tenant-scoped", async () => {
    const tenantA = await createTenantForTest();
    const tenantB = await createTenantForTest();

    const organization = await createOrganization({
      tenantId: tenantA.id,
      code: uniqueKey("org"),
      name: "Operations",
    });

    const tenantAOrganizations = await listOrganizationsByTenant(tenantA.id);
    const tenantBOrganizations = await listOrganizationsByTenant(tenantB.id);

    expect(tenantAOrganizations.map((item) => item.id)).toContain(organization.id);
    expect(tenantBOrganizations).toHaveLength(0);
  });

  it("enforces location hierarchy foreign keys", async () => {
    const tenant = await createTenantForTest();

    await expect(
      createBuilding({
        tenantId: tenant.id,
        siteId: randomUUID(),
        code: uniqueKey("bldg"),
        name: "Invalid Building",
      }),
    ).rejects.toThrow();

    const site = await createSite({ tenantId: tenant.id, code: uniqueKey("site"), name: "HQ" });
    const building = await createBuilding({
      tenantId: tenant.id,
      siteId: site.id,
      code: uniqueKey("bldg"),
      name: "Main Building",
    });
    const floor = await createFloor({
      tenantId: tenant.id,
      buildingId: building.id,
      code: uniqueKey("floor"),
      name: "First Floor",
    });
    const room = await createRoom({
      tenantId: tenant.id,
      floorId: floor.id,
      code: uniqueKey("room"),
      name: "IT Storage",
    });

    expect(room.floorId).toBe(floor.id);
  });

  it("blocks duplicate asset tags and serial numbers per tenant", async () => {
    const tenant = await createTenantForTest();
    const assetType = await createAssetTypeForTest(tenant.id);
    const manufacturer = await createManufacturer({ tenantId: tenant.id, name: uniqueKey("Dell") });
    const model = await createAssetModel({
      tenantId: tenant.id,
      manufacturerId: manufacturer.id,
      name: uniqueKey("Latitude"),
      modelNumber: "7420",
    });

    const assetTag = uniqueKey("asset");
    const serialNumber = uniqueKey("serial");

    const asset = await createAsset({
      tenantId: tenant.id,
      assetTypeId: assetType.id,
      modelId: model.id,
      assetTag,
      serialNumber,
      name: "Finance Laptop",
    });

    await expect(
      createAsset({
        tenantId: tenant.id,
        assetTypeId: assetType.id,
        assetTag,
        name: "Duplicate Tag Laptop",
      }),
    ).rejects.toThrow();

    await expect(
      createAsset({
        tenantId: tenant.id,
        assetTypeId: assetType.id,
        assetTag: uniqueKey("asset"),
        serialNumber,
        name: "Duplicate Serial Laptop",
      }),
    ).rejects.toThrow();

    const foundAsset = await findAssetByTag(tenant.id, asset.assetTag);
    expect(foundAsset?.id).toBe(asset.id);
  });

  it("enforces asset foreign keys", async () => {
    const tenant = await createTenantForTest();

    await expect(
      createAsset({
        tenantId: tenant.id,
        assetTypeId: randomUUID(),
        assetTag: uniqueKey("asset"),
        name: "Invalid Asset",
      }),
    ).rejects.toThrow();
  });

  it("supports append-only audit log repository behavior", async () => {
    const tenant = await createTenantForTest();
    const entityId = randomUUID();

    const firstLog = await appendAuditLog({
      tenantId: tenant.id,
      action: "asset.created",
      entityType: "asset",
      entityId,
      metadata: { assetTag: "A-1000" },
    });
    const secondLog = await appendAuditLog({
      tenantId: tenant.id,
      action: "asset.updated",
      entityType: "asset",
      entityId,
      metadata: { status: "in_use" },
    });

    const logs = await listAuditLogsForEntity(tenant.id, "asset", entityId);

    expect(logs.map((log) => log.id)).toEqual([firstLog.id, secondLog.id]);
  });
});
