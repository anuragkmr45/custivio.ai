import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { authenticateWithPassword, setUserPassword } from "@custivio/auth";
import {
  createAssetForSession,
  createCatalogResource,
  deleteAssetAttachmentForSession,
  getAssetDetail,
  getAssetAttachmentDownloadForSession,
  listAssetsForSession,
  uploadAssetAttachmentForSession,
} from "@custivio/core";
import {
  assignRoleToUser,
  createUser,
  findRoleByKey,
  findTenantBySlug,
  seedDatabase,
  type Tenant,
  type User,
} from "@custivio/db";
import { calculateSha256Hex, maxUploadBytes } from "@custivio/storage";

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

async function createActiveUser(tenantId: string, email = uniqueEmail("asset")): Promise<User> {
  const user = await createUser({
    tenantId,
    email,
    displayName: "Asset Test User",
    status: "active",
  });

  await setUserPassword({
    tenantId,
    userId: user.id,
    password: validPassword,
  });

  return user;
}

async function createSessionWithRole(roleKey?: string): Promise<{ token: string; tenant: Tenant }> {
  const tenant = await getDefaultTenant();
  const user = await createActiveUser(tenant.id);

  if (roleKey) {
    const role = await findRoleByKey(tenant.id, roleKey);

    if (!role) {
      throw new Error(`${roleKey} role was not seeded.`);
    }

    await assignRoleToUser({
      tenantId: tenant.id,
      userId: user.id,
      roleId: role.id,
    });
  }

  const login = await authenticateWithPassword({
    tenantSlug: tenant.slug,
    email: user.email,
    password: validPassword,
  });

  return { token: login.sessionToken, tenant };
}

async function createAssetTypeForSession(token: string): Promise<string> {
  const category = await createCatalogResource(token, "categories", {
    key: uniqueKey("asset-registry"),
    name: "Asset Registry",
  });
  const assetType = await createCatalogResource(token, "types", {
    categoryId: category.id,
    key: uniqueKey("laptop"),
    name: "Laptop",
    trackingMode: "asset",
  });

  return assetType.id;
}

describe.skipIf(!runDbTests)("asset registry services", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("creates asset detail with QR payload and lifecycle event", async () => {
    const { token } = await createSessionWithRole("administrator");
    const assetTypeId = await createAssetTypeForSession(token);
    const asset = await createAssetForSession(token, {
      assetTypeId,
      assetTag: uniqueKey("asset"),
      serialNumber: uniqueKey("serial"),
      name: "Finance Laptop",
      status: "in_stock",
      condition: "good",
    });

    const detail = await getAssetDetail(token, asset.id);

    expect(detail.asset.id).toBe(asset.id);
    expect(detail.qrPayload).toContain(asset.assetTag);
    expect(detail.lifecycleEvents.map((event) => event.eventType)).toContain("asset.created");
  });

  it("rejects duplicate asset tag and serial number per tenant", async () => {
    const { token } = await createSessionWithRole("administrator");
    const assetTypeId = await createAssetTypeForSession(token);
    const assetTag = uniqueKey("asset");
    const serialNumber = uniqueKey("serial");

    await createAssetForSession(token, {
      assetTypeId,
      assetTag,
      serialNumber,
      name: "Original Asset",
    });

    await expect(
      createAssetForSession(token, {
        assetTypeId,
        assetTag,
        name: "Duplicate Tag",
      }),
    ).rejects.toThrow();

    await expect(
      createAssetForSession(token, {
        assetTypeId,
        assetTag: uniqueKey("asset"),
        serialNumber,
        name: "Duplicate Serial",
      }),
    ).rejects.toThrow();
  });

  it("lists assets with server-side search and pagination metadata", async () => {
    const { token } = await createSessionWithRole("administrator");
    const assetTypeId = await createAssetTypeForSession(token);
    const searchKey = uniqueKey("asset-page");

    await Promise.all([
      createAssetForSession(token, {
        assetTypeId,
        assetTag: `${searchKey}-001`,
        name: "Paged Asset 1",
      }),
      createAssetForSession(token, {
        assetTypeId,
        assetTag: `${searchKey}-002`,
        name: "Paged Asset 2",
      }),
      createAssetForSession(token, {
        assetTypeId,
        assetTag: `${searchKey}-003`,
        name: "Paged Asset 3",
      }),
    ]);

    const firstPage = await listAssetsForSession(token, {
      search: searchKey,
      limit: 2,
      offset: 0,
    });
    const secondPage = await listAssetsForSession(token, {
      search: searchKey,
      limit: 2,
      offset: 2,
    });

    expect(firstPage.assets).toHaveLength(2);
    expect(firstPage.pageInfo).toEqual({
      total: 3,
      limit: 2,
      offset: 0,
      hasNextPage: true,
    });
    expect(secondPage.assets).toHaveLength(1);
    expect(secondPage.pageInfo).toEqual({
      total: 3,
      limit: 2,
      offset: 2,
      hasNextPage: false,
    });
  });

  it("rejects attachment upload without assets.write permission", async () => {
    const { token: adminToken } = await createSessionWithRole("administrator");
    const { token: readOnlyToken } = await createSessionWithRole();
    const assetTypeId = await createAssetTypeForSession(adminToken);
    const asset = await createAssetForSession(adminToken, {
      assetTypeId,
      assetTag: uniqueKey("asset"),
      name: "Protected Attachment Asset",
    });

    await expect(
      uploadAssetAttachmentForSession(readOnlyToken, asset.id, {
        filename: "blocked.txt",
        contentType: "text/plain",
        body: new TextEncoder().encode("blocked"),
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("uploads attachment metadata and lifecycle event for authorized users", async () => {
    const { token } = await createSessionWithRole("administrator");
    const assetTypeId = await createAssetTypeForSession(token);
    const asset = await createAssetForSession(token, {
      assetTypeId,
      assetTag: uniqueKey("asset"),
      name: "Attachment Asset",
    });

    const body = new TextEncoder().encode("invoice");
    const attachment = await uploadAssetAttachmentForSession(token, asset.id, {
      filename: "invoice.txt",
      contentType: "text/plain",
      body,
    });
    const detail = await getAssetDetail(token, asset.id);
    const download = await getAssetAttachmentDownloadForSession(token, asset.id, attachment.id);

    expect(attachment.checksumSha256).toBe(calculateSha256Hex(body));
    expect(attachment.contentLength).toBe(body.byteLength);
    expect(new TextDecoder().decode(download.object.body)).toBe("invoice");
    expect(download.contentDisposition).toBe('attachment; filename="invoice.txt"');
    expect(detail.attachments.map((item) => item.id)).toContain(attachment.id);
    expect(detail.lifecycleEvents.map((event) => event.eventType)).toContain(
      "asset.attachment_uploaded",
    );

    const deleted = await deleteAssetAttachmentForSession(token, asset.id, attachment.id);
    const detailAfterDelete = await getAssetDetail(token, asset.id);

    expect(deleted.status).toBe("deleted");
    expect(detailAfterDelete.attachments.map((item) => item.id)).not.toContain(attachment.id);
    await expect(
      getAssetAttachmentDownloadForSession(token, asset.id, attachment.id),
    ).rejects.toMatchObject({ code: "asset_attachment_not_found" });
  });

  it("rejects invalid attachment MIME type and oversized files", async () => {
    const { token } = await createSessionWithRole("administrator");
    const assetTypeId = await createAssetTypeForSession(token);
    const asset = await createAssetForSession(token, {
      assetTypeId,
      assetTag: uniqueKey("asset"),
      name: "Attachment Policy Asset",
    });

    await expect(
      uploadAssetAttachmentForSession(token, asset.id, {
        filename: "malware.exe",
        contentType: "application/x-msdownload",
        body: new TextEncoder().encode("blocked"),
      }),
    ).rejects.toMatchObject({ code: "invalid_asset_input" });

    await expect(
      uploadAssetAttachmentForSession(token, asset.id, {
        filename: "oversized.bin",
        contentType: "application/octet-stream",
        body: new Uint8Array(maxUploadBytes + 1),
      }),
    ).rejects.toMatchObject({ code: "invalid_asset_input" });
  });
});
