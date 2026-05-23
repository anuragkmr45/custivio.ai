import { beforeAll, describe, expect, it } from "vitest";

import { authenticateWithPassword } from "@custivio/auth";
import {
  assetCustodyAssignments,
  assets,
  assetTransferRequests,
  auditCampaigns,
  auditScanResults,
  bins,
  buildings,
  departments,
  exportJobs,
  findTenantBySlug,
  floors,
  getUatSeedCredentials,
  getDb,
  importJobs,
  organizations,
  racks,
  rooms,
  seedUatDatabase,
  shelves,
  sites,
  stockBalances,
  stockItems,
  stockLedgerEntries,
  users,
} from "@custivio/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("UAT seed data", () => {
  beforeAll(async () => {
    await seedUatDatabase();
  });

  it("is idempotent for the main frontend handoff records", async () => {
    await seedUatDatabase();
    await seedUatDatabase();

    const tenant = await findTenantBySlug("default");

    expect(tenant).toBeDefined();

    const tenantId = tenant!.id;
    const uatSeedCredentials = getUatSeedCredentials();
    const seededEmails = uatSeedCredentials.map((credential) => credential.email);
    const userRows = await getDb().select().from(users);
    const assetRows = await getDb().select().from(assets);
    const stockItemRows = await getDb().select().from(stockItems);
    const importRows = await getDb().select().from(importJobs);
    const exportRows = await getDb().select().from(exportJobs);

    expect(
      userRows.filter((user) => user.tenantId === tenantId && seededEmails.includes(user.email)),
    ).toHaveLength(7);
    expect(
      assetRows.filter(
        (asset) =>
          asset.tenantId === tenantId &&
          ["UAT-LAP-001", "UAT-SRV-001", "UAT-NET-001"].includes(asset.assetTag),
      ),
    ).toHaveLength(3);
    expect(
      stockItemRows.filter(
        (item) =>
          item.tenantId === tenantId &&
          ["UAT-CABLE-CAT6-1M", "UAT-CONS-THERMAL-PASTE", "UAT-CHIP-TPM-2"].includes(item.sku),
      ),
    ).toHaveLength(3);
    expect(
      importRows.filter(
        (job) => job.tenantId === tenantId && job.idempotencyKey === "uat-seed-import-assets",
      ),
    ).toHaveLength(1);
    expect(
      exportRows.filter(
        (job) => job.tenantId === tenantId && job.idempotencyKey === "uat-seed-export-assets",
      ),
    ).toHaveLength(1);
  });

  it("creates login-capable local-only UAT users for every persona", async () => {
    const uatSeedCredentials = getUatSeedCredentials();

    for (const credential of uatSeedCredentials) {
      const result = await authenticateWithPassword({
        tenantSlug: "default",
        email: credential.email,
        password: credential.password,
        requestId: `uat-seed-login-${credential.roleKey}`,
      });

      expect(result.session.user.email).toBe(credential.email);
      expect(result.session.permissionKeys.length).toBeGreaterThan(0);
    }
  });

  it("has representative domain records for frontend flows", async () => {
    const tenant = await findTenantBySlug("default");

    expect(tenant).toBeDefined();

    const tenantId = tenant!.id;
    const [
      organizationRows,
      departmentRows,
      siteRows,
      buildingRows,
      floorRows,
      roomRows,
      rackRows,
      shelfRows,
      binRows,
      userRows,
      assetRows,
      stockItemRows,
      stockBalanceRows,
      ledgerRows,
      custodyRows,
      transferRows,
      campaignRows,
      scanRows,
      importRows,
      exportRows,
    ] = await Promise.all([
      getDb().select().from(organizations),
      getDb().select().from(departments),
      getDb().select().from(sites),
      getDb().select().from(buildings),
      getDb().select().from(floors),
      getDb().select().from(rooms),
      getDb().select().from(racks),
      getDb().select().from(shelves),
      getDb().select().from(bins),
      getDb().select().from(users),
      getDb().select().from(assets),
      getDb().select().from(stockItems),
      getDb().select().from(stockBalances),
      getDb().select().from(stockLedgerEntries),
      getDb().select().from(assetCustodyAssignments),
      getDb().select().from(assetTransferRequests),
      getDb().select().from(auditCampaigns),
      getDb().select().from(auditScanResults),
      getDb().select().from(importJobs),
      getDb().select().from(exportJobs),
    ]);

    expect(
      organizationRows.filter((row) => row.tenantId === tenantId).length,
    ).toBeGreaterThanOrEqual(1);
    expect(departmentRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(
      2,
    );
    expect(siteRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(buildingRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(floorRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(roomRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(rackRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(shelfRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(binRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(userRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(7);
    expect(
      assetRows.filter((row) => row.tenantId === tenantId).map((asset) => asset.assetTag),
    ).toEqual(expect.arrayContaining(["UAT-LAP-001", "UAT-SRV-001", "UAT-NET-001"]));
    expect(stockItemRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      stockBalanceRows.filter((row) => row.tenantId === tenantId).length,
    ).toBeGreaterThanOrEqual(3);
    expect(ledgerRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(3);
    expect(custodyRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(transferRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(campaignRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(scanRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(importRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
    expect(exportRows.filter((row) => row.tenantId === tenantId).length).toBeGreaterThanOrEqual(1);
  });
});
