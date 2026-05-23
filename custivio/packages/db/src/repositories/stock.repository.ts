import { and, asc, desc, eq, lte } from "drizzle-orm";

import { getDb } from "../client";
import {
  stockAdjustments,
  stockBalances,
  stockItems,
  stockLedgerEntries,
  stockLowStockRules,
  stockTransfers,
  stockUnits,
  type NewStockItem,
  type NewStockLedgerEntry,
  type NewStockLowStockRule,
  type NewStockUnit,
  type StockBalance,
  type StockItem,
  type StockLedgerEntry,
  type StockLowStockRule,
  type StockUnit,
} from "../schema";

export type StockMovementType = "receive" | "issue" | "transfer" | "adjust";

export interface StockMovementInput {
  tenantId: string;
  stockItemId: string;
  movementType: StockMovementType;
  quantity: number;
  fromLocationKey?: string;
  toLocationKey?: string;
  reason?: string;
  referenceId?: string;
  idempotencyKey?: string;
  createdByUserId?: string;
  metadata?: Record<string, unknown>;
}

export async function createStockUnit(
  values: Pick<NewStockUnit, "tenantId" | "code" | "name">,
): Promise<StockUnit> {
  const [unit] = await getDb()
    .insert(stockUnits)
    .values({
      tenantId: values.tenantId,
      code: values.code.toLowerCase(),
      name: values.name,
      status: "active",
    })
    .returning();

  if (!unit) {
    throw new Error("Failed to create stock unit.");
  }

  return unit;
}

export async function listStockUnitsByTenant(tenantId: string): Promise<StockUnit[]> {
  return getDb()
    .select()
    .from(stockUnits)
    .where(eq(stockUnits.tenantId, tenantId))
    .orderBy(asc(stockUnits.name));
}

export async function createStockItem(
  values: Pick<NewStockItem, "tenantId" | "unitId" | "sku" | "name"> &
    Partial<Pick<NewStockItem, "itemType" | "lowStockThreshold">>,
): Promise<StockItem> {
  const [item] = await getDb()
    .insert(stockItems)
    .values({
      tenantId: values.tenantId,
      unitId: values.unitId,
      sku: values.sku.toUpperCase(),
      name: values.name,
      itemType: values.itemType ?? "consumable",
      lowStockThreshold: values.lowStockThreshold ?? 0,
      status: "active",
    })
    .returning();

  if (!item) {
    throw new Error("Failed to create stock item.");
  }

  return item;
}

export async function listStockItemsByTenant(tenantId: string): Promise<StockItem[]> {
  return getDb()
    .select()
    .from(stockItems)
    .where(eq(stockItems.tenantId, tenantId))
    .orderBy(asc(stockItems.sku));
}

export async function findStockItemBySku(
  tenantId: string,
  sku: string,
): Promise<StockItem | undefined> {
  const [item] = await getDb()
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.tenantId, tenantId), eq(stockItems.sku, sku.toUpperCase())))
    .limit(1);

  return item;
}

export async function upsertLowStockRule(
  values: Pick<NewStockLowStockRule, "tenantId" | "stockItemId" | "threshold"> &
    Partial<Pick<NewStockLowStockRule, "locationKey">>,
): Promise<StockLowStockRule> {
  const locationKey = values.locationKey ?? "default";
  const [rule] = await getDb()
    .insert(stockLowStockRules)
    .values({
      tenantId: values.tenantId,
      stockItemId: values.stockItemId,
      locationKey,
      threshold: values.threshold,
    })
    .onConflictDoUpdate({
      target: [
        stockLowStockRules.tenantId,
        stockLowStockRules.stockItemId,
        stockLowStockRules.locationKey,
      ],
      set: { threshold: values.threshold, updatedAt: new Date() },
    })
    .returning();

  if (!rule) {
    throw new Error("Failed to upsert low-stock rule.");
  }

  return rule;
}

export async function listStockBalancesByTenant(tenantId: string): Promise<StockBalance[]> {
  return getDb()
    .select()
    .from(stockBalances)
    .where(eq(stockBalances.tenantId, tenantId))
    .orderBy(asc(stockBalances.locationKey));
}

export async function listStockLedgerByTenant(tenantId: string): Promise<StockLedgerEntry[]> {
  return getDb()
    .select()
    .from(stockLedgerEntries)
    .where(eq(stockLedgerEntries.tenantId, tenantId))
    .orderBy(desc(stockLedgerEntries.createdAt));
}

export async function findStockLedgerEntryByIdempotencyKey(
  tenantId: string,
  idempotencyKey: string,
): Promise<StockLedgerEntry | undefined> {
  const [entry] = await getDb()
    .select()
    .from(stockLedgerEntries)
    .where(
      and(
        eq(stockLedgerEntries.tenantId, tenantId),
        eq(stockLedgerEntries.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return entry;
}

export async function listLowStockBalances(tenantId: string): Promise<StockBalance[]> {
  return getDb()
    .select({ balance: stockBalances })
    .from(stockBalances)
    .innerJoin(
      stockLowStockRules,
      and(
        eq(stockBalances.tenantId, stockLowStockRules.tenantId),
        eq(stockBalances.stockItemId, stockLowStockRules.stockItemId),
        eq(stockBalances.locationKey, stockLowStockRules.locationKey),
      ),
    )
    .where(
      and(
        eq(stockBalances.tenantId, tenantId),
        lte(stockBalances.quantityOnHand, stockLowStockRules.threshold),
      ),
    )
    .then((rows) => rows.map((row) => row.balance));
}

async function adjustBalance(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  tenantId: string,
  stockItemId: string,
  locationKey: string,
  quantityDelta: number,
): Promise<void> {
  const [existing] = await tx
    .select()
    .from(stockBalances)
    .where(
      and(
        eq(stockBalances.tenantId, tenantId),
        eq(stockBalances.stockItemId, stockItemId),
        eq(stockBalances.locationKey, locationKey),
      ),
    )
    .limit(1);
  const nextQuantity = (existing?.quantityOnHand ?? 0) + quantityDelta;

  if (nextQuantity < 0) {
    throw new Error("Insufficient stock for movement.");
  }

  if (existing) {
    await tx
      .update(stockBalances)
      .set({ quantityOnHand: nextQuantity, updatedAt: new Date() })
      .where(eq(stockBalances.id, existing.id));
    return;
  }

  await tx.insert(stockBalances).values({
    tenantId,
    stockItemId,
    locationKey,
    quantityOnHand: nextQuantity,
  });
}

export async function recordStockMovement(input: StockMovementInput): Promise<StockLedgerEntry> {
  if (input.quantity <= 0 && input.movementType !== "adjust") {
    throw new Error("Stock movement quantity must be positive.");
  }

  return getDb().transaction(async (tx) => {
    const fromLocationKey = input.fromLocationKey ?? "default";
    const toLocationKey = input.toLocationKey ?? "default";

    if (input.movementType === "receive") {
      await adjustBalance(tx, input.tenantId, input.stockItemId, toLocationKey, input.quantity);
    } else if (input.movementType === "issue") {
      await adjustBalance(tx, input.tenantId, input.stockItemId, fromLocationKey, -input.quantity);
    } else if (input.movementType === "transfer") {
      await adjustBalance(tx, input.tenantId, input.stockItemId, fromLocationKey, -input.quantity);
      await adjustBalance(tx, input.tenantId, input.stockItemId, toLocationKey, input.quantity);
      await tx.insert(stockTransfers).values({
        tenantId: input.tenantId,
        stockItemId: input.stockItemId,
        quantity: input.quantity,
        fromLocationKey,
        toLocationKey,
        createdByUserId: input.createdByUserId,
      });
    } else {
      await adjustBalance(tx, input.tenantId, input.stockItemId, toLocationKey, input.quantity);
      await tx.insert(stockAdjustments).values({
        tenantId: input.tenantId,
        stockItemId: input.stockItemId,
        locationKey: toLocationKey,
        quantityDelta: input.quantity,
        reason: input.reason ?? "manual_adjustment",
        createdByUserId: input.createdByUserId,
      });
    }

    const [ledger] = await tx
      .insert(stockLedgerEntries)
      .values({
        tenantId: input.tenantId,
        stockItemId: input.stockItemId,
        movementType: input.movementType,
        quantity: input.quantity,
        fromLocationKey: input.movementType === "receive" ? undefined : fromLocationKey,
        toLocationKey: input.movementType === "issue" ? undefined : toLocationKey,
        referenceId: input.referenceId,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata ?? {},
        createdByUserId: input.createdByUserId,
      } satisfies NewStockLedgerEntry)
      .returning();

    if (!ledger) {
      throw new Error("Failed to create stock ledger entry.");
    }

    return ledger;
  });
}
