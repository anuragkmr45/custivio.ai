import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { authenticateWithPassword, setUserPassword } from "@custivio/auth";
import {
  checkInAssetForSession,
  checkoutAssetForSession,
  createAssetForSession,
  createCatalogResource,
  createTransferRequestForSession,
  createWarrantyForSession,
  decideTransferRequestForSession,
  getAssetDetail,
  handoverAssetForSession,
  listCustodyOverview,
  listMaintenanceOverview,
  openMaintenanceTicketForSession,
  updateMaintenanceTicketStatusForSession,
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

async function createActiveUser(tenantId: string, displayName = "Operations User"): Promise<User> {
  return createUser({
    tenantId,
    email: uniqueEmail("operations"),
    displayName,
    status: "active",
  });
}

async function createAdminSession(): Promise<{ token: string; tenant: Tenant }> {
  const tenant = await getDefaultTenant();
  const user = await createActiveUser(tenant.id, "Operations Admin");

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

  return { token: login.sessionToken, tenant };
}

async function createAssetTypeForSession(token: string): Promise<string> {
  const category = await createCatalogResource(token, "categories", {
    key: uniqueKey("operations-category"),
    name: "Operations Category",
  });
  const assetType = await createCatalogResource(token, "types", {
    categoryId: category.id,
    key: uniqueKey("operations-type"),
    name: "Operations Asset",
    trackingMode: "asset",
  });

  return assetType.id;
}

async function createOperationsAsset(token: string) {
  const assetTypeId = await createAssetTypeForSession(token);

  return createAssetForSession(token, {
    assetTypeId,
    assetTag: uniqueKey("ops-asset"),
    serialNumber: uniqueKey("ops-serial"),
    name: "Operations Laptop",
    status: "in_stock",
    condition: "good",
  });
}

describe.skipIf(!runDbTests)("custody, movement, and maintenance", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("checks out, hands over, and checks in an asset with asset state changes", async () => {
    const { token, tenant } = await createAdminSession();
    const firstCustodian = await createActiveUser(tenant.id, "First Custodian");
    const secondCustodian = await createActiveUser(tenant.id, "Second Custodian");
    const asset = await createOperationsAsset(token);

    const checkout = await checkoutAssetForSession(token, {
      assetId: asset.id,
      assignedToUserId: firstCustodian.id,
      notes: "Issued for project work",
    });
    const checkedOutDetail = await getAssetDetail(token, asset.id);

    expect(checkout.status).toBe("active");
    expect(checkedOutDetail.asset.status).toBe("in_use");
    expect(checkedOutDetail.asset.custodianUserId).toBe(firstCustodian.id);

    const handover = await handoverAssetForSession(token, {
      assignmentId: checkout.id,
      toUserId: secondCustodian.id,
      notes: "Shift handover",
    });
    const handedOverDetail = await getAssetDetail(token, asset.id);
    const custodyOverview = await listCustodyOverview(token);

    expect(handover.status).toBe("active");
    expect(handedOverDetail.asset.custodianUserId).toBe(secondCustodian.id);
    expect(
      custodyOverview.assignments.find((assignment) => assignment.id === checkout.id)?.status,
    ).toBe("handed_over");

    const checkIn = await checkInAssetForSession(token, {
      assignmentId: handover.id,
      notes: "Returned to store",
    });
    const checkedInDetail = await getAssetDetail(token, asset.id);

    expect(checkIn.status).toBe("checked_in");
    expect(checkedInDetail.asset.status).toBe("in_stock");
    expect(checkedInDetail.asset.custodianUserId).toBeNull();
  });

  it("approves and rejects transfer requests without losing request history", async () => {
    const { token, tenant } = await createAdminSession();
    const targetCustodian = await createActiveUser(tenant.id, "Transfer Custodian");
    const rejectedCustodian = await createActiveUser(tenant.id, "Rejected Custodian");
    const asset = await createOperationsAsset(token);

    const rejected = await createTransferRequestForSession(token, {
      assetId: asset.id,
      toCustodianUserId: rejectedCustodian.id,
      reason: "Incorrect destination",
    });
    const rejectedDecision = await decideTransferRequestForSession(token, rejected.id, {
      decision: "rejected",
      decisionNote: "Wrong user",
    });
    const afterRejection = await getAssetDetail(token, asset.id);

    expect(rejectedDecision.status).toBe("rejected");
    expect(afterRejection.asset.custodianUserId).toBeNull();

    const approved = await createTransferRequestForSession(token, {
      assetId: asset.id,
      toCustodianUserId: targetCustodian.id,
      reason: "Move to new owner",
    });
    const approvedDecision = await decideTransferRequestForSession(token, approved.id, {
      decision: "approved",
      decisionNote: "Approved",
    });
    const afterApproval = await getAssetDetail(token, asset.id);
    const custodyOverview = await listCustodyOverview(token);

    expect(approvedDecision.status).toBe("approved");
    expect(afterApproval.asset.status).toBe("in_use");
    expect(afterApproval.asset.custodianUserId).toBe(targetCustodian.id);
    expect(custodyOverview.transfers.map((transfer) => transfer.id)).toEqual(
      expect.arrayContaining([approved.id, rejected.id]),
    );
  });

  it("opens and resolves maintenance tickets and records warranties", async () => {
    const { token, tenant } = await createAdminSession();
    const technician = await createActiveUser(tenant.id, "Maintenance Technician");
    const asset = await createOperationsAsset(token);

    const ticket = await openMaintenanceTicketForSession(token, {
      assetId: asset.id,
      assignedToUserId: technician.id,
      priority: "high",
      issueSummary: "Fan failure",
    });
    const maintenanceDetail = await getAssetDetail(token, asset.id);

    expect(ticket.status).toBe("open");
    expect(maintenanceDetail.asset.status).toBe("maintenance");
    expect(maintenanceDetail.asset.condition).toBe("repair_needed");

    const resolved = await updateMaintenanceTicketStatusForSession(token, ticket.id, {
      status: "resolved",
      note: "Fan replaced",
      resolutionSummary: "Replaced fan and verified thermals",
      downtimeMinutes: 45,
    });
    const resolvedDetail = await getAssetDetail(token, asset.id);

    expect(resolved.status).toBe("resolved");
    expect(resolved.downtimeMinutes).toBe(45);
    expect(resolvedDetail.asset.status).toBe("in_stock");
    expect(resolvedDetail.asset.condition).toBe("good");

    const warranty = await createWarrantyForSession(token, {
      assetId: asset.id,
      provider: "Vendor Warranty",
      contractNumber: uniqueKey("contract"),
      startsAt: "2026-01-01",
      endsAt: "2027-01-01",
      notes: "Standard support",
    });
    const overview = await listMaintenanceOverview(token);

    expect(warranty.status).toBe("active");
    expect(overview.warranties.map((item) => item.id)).toContain(warranty.id);
  });
});
