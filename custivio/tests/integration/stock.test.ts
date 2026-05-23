import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { authenticateWithPassword, setUserPassword } from "@custivio/auth";
import {
  createStockItemForSession,
  createStockUnitForSession,
  listStockOverview,
  recordStockMovementForSession,
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

async function createActiveUser(tenantId: string): Promise<User> {
  const user = await createUser({
    tenantId,
    email: uniqueEmail("stock"),
    displayName: "Stock Test User",
    status: "active",
  });

  await setUserPassword({
    tenantId,
    userId: user.id,
    password: validPassword,
  });

  return user;
}

async function createAdminSession(): Promise<string> {
  const tenant = await getDefaultTenant();
  const user = await createActiveUser(tenant.id);
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

async function createStockItem(token: string) {
  const unit = await createStockUnitForSession(token, {
    code: uniqueKey("ea"),
    name: "Each",
  });

  return createStockItemForSession(token, {
    unitId: unit.id,
    sku: uniqueKey("sku"),
    name: "Patch Cable",
    itemType: "cable",
    lowStockThreshold: 5,
  });
}

describe.skipIf(!runDbTests)("stock and consumables", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("receives and issues stock with immutable ledger entries", async () => {
    const token = await createAdminSession();
    const item = await createStockItem(token);

    await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "receive",
      quantity: 10,
      toLocationKey: "main",
    });
    await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "issue",
      quantity: 3,
      fromLocationKey: "main",
    });

    const overview = await listStockOverview(token);
    const balance = overview.balances.find(
      (row) => row.stockItemId === item.id && row.locationKey === "main",
    );
    const ledger = overview.ledger.filter((entry) => entry.stockItemId === item.id);

    expect(balance?.quantityOnHand).toBe(7);
    expect(ledger.map((entry) => entry.movementType)).toEqual(["issue", "receive"]);
  });

  it("does not write ledger or mutate balance when issue would go negative", async () => {
    const token = await createAdminSession();
    const item = await createStockItem(token);

    await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "receive",
      quantity: 2,
      toLocationKey: "main",
    });

    const before = await listStockOverview(token);
    const beforeLedgerCount = before.ledger.filter((entry) => entry.stockItemId === item.id).length;

    await expect(
      recordStockMovementForSession(token, {
        stockItemId: item.id,
        movementType: "issue",
        quantity: 5,
        fromLocationKey: "main",
      }),
    ).rejects.toMatchObject({ code: "insufficient_stock" });

    const after = await listStockOverview(token);
    const balance = after.balances.find(
      (row) => row.stockItemId === item.id && row.locationKey === "main",
    );
    const afterLedgerCount = after.ledger.filter((entry) => entry.stockItemId === item.id).length;

    expect(balance?.quantityOnHand).toBe(2);
    expect(afterLedgerCount).toBe(beforeLedgerCount);
  });

  it("transfers stock between locations", async () => {
    const token = await createAdminSession();
    const item = await createStockItem(token);

    await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "receive",
      quantity: 10,
      toLocationKey: "bin-a",
    });
    await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "transfer",
      quantity: 4,
      fromLocationKey: "bin-a",
      toLocationKey: "bin-b",
    });

    const overview = await listStockOverview(token);
    const binA = overview.balances.find(
      (row) => row.stockItemId === item.id && row.locationKey === "bin-a",
    );
    const binB = overview.balances.find(
      (row) => row.stockItemId === item.id && row.locationKey === "bin-b",
    );

    expect(binA?.quantityOnHand).toBe(6);
    expect(binB?.quantityOnHand).toBe(4);
  });

  it("replays identical stock movement idempotency keys and rejects mismatched payloads", async () => {
    const token = await createAdminSession();
    const item = await createStockItem(token);
    const idempotencyKey = uniqueKey("stock-idem");

    const first = await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "receive",
      quantity: 10,
      toLocationKey: "main",
      idempotencyKey,
    });
    const replay = await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "receive",
      quantity: 10,
      toLocationKey: "main",
      idempotencyKey,
    });

    expect(replay.id).toBe(first.id);
    await expect(
      recordStockMovementForSession(token, {
        stockItemId: item.id,
        movementType: "receive",
        quantity: 11,
        toLocationKey: "main",
        idempotencyKey,
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
  });

  it("reports low stock at or below threshold", async () => {
    const token = await createAdminSession();
    const item = await createStockItem(token);

    await recordStockMovementForSession(token, {
      stockItemId: item.id,
      movementType: "receive",
      quantity: 4,
      toLocationKey: "default",
    });

    const overview = await listStockOverview(token);

    expect(overview.lowStock.map((balance) => balance.stockItemId)).toContain(item.id);
  });
});
