import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { authenticateWithPassword, setUserPassword } from "@custivio/auth";
import {
  createAssetForSession,
  createAuditCampaignForSession,
  createCatalogResource,
  createExportJobForSession,
  createImportPreviewForSession,
  getExportDownloadForSession,
  createSavedFilterForSession,
  listReportingOverview,
  processImportJobForSession,
  recordAuditScanForSession,
} from "@custivio/core";
import {
  assignRoleToUser,
  createUser,
  findRoleByKey,
  findTenantBySlug,
  seedDatabase,
  type Tenant,
} from "@custivio/db";
import { calculateSha256Hex } from "@custivio/storage";

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

async function createAdminSession(): Promise<string> {
  const tenant = await getDefaultTenant();
  const user = await createUser({
    tenantId: tenant.id,
    email: uniqueEmail("reporting"),
    displayName: "Reporting Admin",
    status: "active",
  });

  await setUserPassword({
    tenantId: tenant.id,
    userId: user.id,
    password: validPassword,
  });

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

  return login.sessionToken;
}

async function createReportingAsset(token: string) {
  const category = await createCatalogResource(token, "categories", {
    key: uniqueKey("reporting-category"),
    name: "Reporting Category",
  });
  const assetType = await createCatalogResource(token, "types", {
    categoryId: category.id,
    key: uniqueKey("reporting-type"),
    name: "Reporting Asset",
    trackingMode: "asset",
  });

  return createAssetForSession(token, {
    assetTypeId: assetType.id,
    assetTag: uniqueKey("reporting-asset"),
    serialNumber: uniqueKey("reporting-serial"),
    name: "Reporting Laptop",
    status: "in_stock",
    condition: "good",
  });
}

describe.skipIf(!runDbTests)("audit, import, export, and reporting", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("records audit scans and creates findings", async () => {
    const token = await createAdminSession();
    const asset = await createReportingAsset(token);
    const campaign = await createAuditCampaignForSession(token, {
      name: uniqueKey("Quarterly Audit"),
      scope: "laptops",
    });

    const scan = await recordAuditScanForSession(token, {
      campaignId: campaign.id,
      assetId: asset.id,
      scanCode: uniqueKey("scan"),
      resultStatus: "mismatch",
      severity: "high",
      findingDescription: "Serial number did not match.",
    });
    const overview = await listReportingOverview(token);

    expect(scan.resultStatus).toBe("mismatch");
    expect(overview.campaigns.map((item) => item.id)).toContain(campaign.id);
    expect(overview.findings.some((finding) => finding.scanResultId === scan.id)).toBe(true);
  });

  it("previews import rows, preserves idempotency, and blocks double processing", async () => {
    const token = await createAdminSession();
    const idempotencyKey = uniqueKey("import-key");
    const firstPreview = await createImportPreviewForSession(token, {
      importType: "assets",
      originalFilename: "assets.json",
      idempotencyKey,
      rows: [{ assetTag: "A-100", name: "Laptop" }, "bad row"],
    });
    const secondPreview = await createImportPreviewForSession(token, {
      importType: "assets",
      originalFilename: "assets.json",
      idempotencyKey,
      rows: [{ assetTag: "A-100", name: "Laptop" }, "bad row"],
    });

    expect(secondPreview.job.id).toBe(firstPreview.job.id);
    expect(firstPreview.job.totalRows).toBe(2);
    expect(firstPreview.job.failedRows).toBe(1);
    expect(firstPreview.rows.map((row) => row.status)).toEqual(["valid", "invalid"]);
    await expect(
      createImportPreviewForSession(token, {
        importType: "assets",
        originalFilename: "assets.json",
        idempotencyKey,
        rows: [{ assetTag: "A-999", name: "Different Laptop" }],
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });

    const processed = await processImportJobForSession(token, firstPreview.job.id);

    expect(processed.status).toBe("processed");
    expect(processed.processedRows).toBe(1);
    await expect(processImportJobForSession(token, firstPreview.job.id)).rejects.toMatchObject({
      code: "import_job_locked",
    });
  });

  it("creates MinIO-backed export jobs idempotently and saves filters", async () => {
    const token = await createAdminSession();
    const exportIdempotencyKey = uniqueKey("export-key");
    const firstExport = await createExportJobForSession(token, {
      exportType: "asset-summary",
      filters: { status: "in_stock" },
      idempotencyKey: exportIdempotencyKey,
    });
    const secondExport = await createExportJobForSession(token, {
      exportType: "asset-summary",
      filters: { status: "in_stock" },
      idempotencyKey: exportIdempotencyKey,
    });
    const filter = await createSavedFilterForSession(token, {
      module: "assets",
      key: uniqueKey("active-assets"),
      name: "Active Assets",
      filters: { status: "in_stock" },
    });
    const overview = await listReportingOverview(token);
    const download = await getExportDownloadForSession(token, firstExport.id);

    expect(secondExport.id).toBe(firstExport.id);
    await expect(
      createExportJobForSession(token, {
        exportType: "asset-summary",
        filters: { status: "retired" },
        idempotencyKey: exportIdempotencyKey,
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
    expect(firstExport.objectKey).toContain("/exports/");
    expect(firstExport.checksumSha256).toHaveLength(64);
    expect(firstExport.contentLength).toBeGreaterThan(0);
    expect(calculateSha256Hex(download.object.body)).toBe(firstExport.checksumSha256);
    expect(download.contentDisposition).toContain(firstExport.filename);
    expect(overview.exportJobs.map((job) => job.id)).toContain(firstExport.id);
    expect(overview.savedFilters.map((item) => item.id)).toContain(filter.id);
  });
});
