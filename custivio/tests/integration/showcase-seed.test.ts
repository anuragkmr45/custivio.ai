import { beforeAll, describe, expect, it } from "vitest";

import {
  assets,
  findTenantBySlug,
  getDb,
  seedShowcaseDatabase,
  stockItems,
  users,
} from "@custivio/db";

const requiredEnvironment = [
  "BOOTSTRAP_TENANT_SLUG",
  "BOOTSTRAP_TENANT_NAME",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_NAME",
  "BOOTSTRAP_ADMIN_PASSWORD",
] as const;
const runDbTests =
  process.env.RUN_DB_TESTS === "1" &&
  requiredEnvironment.every((key) => Boolean(process.env[key]?.trim()));

describe.skipIf(!runDbTests)("showcase seed data", () => {
  beforeAll(async () => {
    await seedShowcaseDatabase();
  }, 120_000);

  it("is idempotent and provides complete showcase coverage", async () => {
    const first = await seedShowcaseDatabase();
    const second = await seedShowcaseDatabase();

    expect(second).toEqual(first);
    expect(second.users).toBeGreaterThanOrEqual(10);
    expect(second.assets).toBeGreaterThanOrEqual(20);
    expect(second.stockItems).toBeGreaterThanOrEqual(10);
    expect(second.assetMaintenanceTickets).toBeGreaterThanOrEqual(3);
    expect(second.auditCampaigns).toBeGreaterThanOrEqual(2);

    const tenant = await findTenantBySlug(process.env.BOOTSTRAP_TENANT_SLUG!);
    expect(tenant).toBeDefined();

    const [userRows, assetRows, stockRows] = await Promise.all([
      getDb().select().from(users),
      getDb().select().from(assets),
      getDb().select().from(stockItems),
    ]);
    const tenantId = tenant!.id;

    expect(userRows.filter((row) => row.tenantId === tenantId)).toHaveLength(10);
    expect(assetRows.filter((row) => row.tenantId === tenantId).map((row) => row.assetTag)).toEqual(
      expect.arrayContaining(["BLR-LT-2401", "BLR-LT-2503", "HYD-SRV-2301", "BLR-NW-2201"]),
    );
    expect(stockRows.filter((row) => row.tenantId === tenantId)).toHaveLength(10);
  }, 120_000);
});
