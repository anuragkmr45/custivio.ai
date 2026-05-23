import { requirePermission } from "@custivio/auth";
import {
  appendAuditLog,
  createStockItem,
  createStockUnit,
  findStockItemBySku,
  findStockLedgerEntryByIdempotencyKey,
  listLowStockBalances,
  listStockBalancesByTenant,
  listStockItemsByTenant,
  listStockLedgerByTenant,
  listStockUnitsByTenant,
  recordStockMovement,
  upsertLowStockRule,
  type StockBalance,
  type StockItem,
  type StockLedgerEntry,
  type StockMovementType,
  type StockUnit,
} from "@custivio/db";
import { recordStockMovement as recordStockMovementMetric } from "@custivio/telemetry";

import {
  createIdempotencyFingerprint,
  readIdempotencyFingerprint,
  withIdempotencyFingerprint,
} from "../security/idempotency-service";

import { StockError } from "./errors";

export interface StockOverview {
  units: StockUnit[];
  items: StockItem[];
  balances: StockBalance[];
  ledger: StockLedgerEntry[];
  lowStock: StockBalance[];
}

const stockMovementTypes = ["receive", "issue", "transfer", "adjust"] as const;

function isStockMovementType(value: string): value is StockMovementType {
  return stockMovementTypes.some((item) => item === value);
}

function readString(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(input: Record<string, unknown>, key: string): string | undefined {
  const value = readString(input, key);

  return value.length > 0 ? value : undefined;
}

function requireString(input: Record<string, unknown>, key: string): string {
  const value = readString(input, key);

  if (value.length === 0) {
    throw new StockError("invalid_stock_input", `${key} is required.`, 400);
  }

  return value;
}

function readInteger(input: Record<string, unknown>, key: string, defaultValue?: number): number {
  const value = input[key];

  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new StockError("invalid_stock_input", `${key} must be an integer.`, 400);
}

async function writeStockAudit(
  tenantId: string,
  actorUserId: string,
  action: string,
  entityId: string,
  requestId?: string,
): Promise<void> {
  await appendAuditLog({
    tenantId,
    actorUserId,
    action,
    entityType: "stock",
    entityId,
    requestId,
  });
}

function assertStockIdempotencyReplay(
  existing: StockLedgerEntry,
  requestHash: string,
): StockLedgerEntry {
  const existingHash = readIdempotencyFingerprint(existing.metadata);

  if (existingHash && existingHash !== requestHash) {
    throw new StockError(
      "idempotency_conflict",
      "Idempotency key was already used with a different stock movement request.",
      409,
    );
  }

  return existing;
}

export async function listStockOverview(sessionToken: string | undefined): Promise<StockOverview> {
  const session = await requirePermission(sessionToken, "inventory.read");
  const [units, items, balances, ledger, lowStock] = await Promise.all([
    listStockUnitsByTenant(session.tenant.id),
    listStockItemsByTenant(session.tenant.id),
    listStockBalancesByTenant(session.tenant.id),
    listStockLedgerByTenant(session.tenant.id),
    listLowStockBalances(session.tenant.id),
  ]);

  return { units, items, balances, ledger, lowStock };
}

export async function createStockUnitForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<StockUnit> {
  const session = await requirePermission(sessionToken, "inventory.write");
  const unit = await createStockUnit({
    tenantId: session.tenant.id,
    code: requireString(input, "code"),
    name: requireString(input, "name"),
  });

  await writeStockAudit(
    session.tenant.id,
    session.user.id,
    "stock.unit_created",
    unit.id,
    requestId,
  );

  return unit;
}

export async function createStockItemForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<StockItem> {
  const session = await requirePermission(sessionToken, "inventory.write");
  const item = await createStockItem({
    tenantId: session.tenant.id,
    unitId: requireString(input, "unitId"),
    sku: requireString(input, "sku"),
    name: requireString(input, "name"),
    itemType: readOptionalString(input, "itemType"),
    lowStockThreshold: readInteger(input, "lowStockThreshold", 0),
  });

  if (item.lowStockThreshold > 0) {
    await upsertLowStockRule({
      tenantId: session.tenant.id,
      stockItemId: item.id,
      threshold: item.lowStockThreshold,
    });
  }

  await writeStockAudit(
    session.tenant.id,
    session.user.id,
    "stock.item_created",
    item.id,
    requestId,
  );

  return item;
}

export async function recordStockMovementForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<StockLedgerEntry> {
  const session = await requirePermission(sessionToken, "inventory.write");
  const movementType = requireString(input, "movementType");

  if (!isStockMovementType(movementType)) {
    throw new StockError("invalid_stock_input", "movementType is invalid.", 400);
  }

  const movement = {
    tenantId: session.tenant.id,
    stockItemId: requireString(input, "stockItemId"),
    movementType,
    quantity: readInteger(input, "quantity"),
    createdByUserId: session.user.id,
  };
  const fromLocationKey = readOptionalString(input, "fromLocationKey");
  const toLocationKey = readOptionalString(input, "toLocationKey");
  const reason = readOptionalString(input, "reason");
  const referenceId = readOptionalString(input, "referenceId");
  const idempotencyKey = readOptionalString(input, "idempotencyKey");
  const requestHash = idempotencyKey
    ? createIdempotencyFingerprint({
        fromLocationKey: fromLocationKey ?? null,
        movementType,
        quantity: movement.quantity,
        reason: reason ?? null,
        referenceId: referenceId ?? null,
        stockItemId: movement.stockItemId,
        toLocationKey: toLocationKey ?? null,
      })
    : undefined;

  try {
    if (idempotencyKey) {
      const existing = await findStockLedgerEntryByIdempotencyKey(
        session.tenant.id,
        idempotencyKey,
      );

      if (existing) {
        return assertStockIdempotencyReplay(existing, requestHash ?? "");
      }
    }

    const ledger = await recordStockMovement({
      ...movement,
      ...(fromLocationKey ? { fromLocationKey } : {}),
      ...(toLocationKey ? { toLocationKey } : {}),
      ...(reason ? { reason } : {}),
      ...(referenceId ? { referenceId } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      ...(requestHash ? { metadata: withIdempotencyFingerprint({}, requestHash) } : {}),
    });

    await writeStockAudit(
      session.tenant.id,
      session.user.id,
      `stock.${movementType}`,
      ledger.stockItemId,
      requestId,
    );
    recordStockMovementMetric(movementType);

    return ledger;
  } catch (error) {
    if (idempotencyKey) {
      const existing = await findStockLedgerEntryByIdempotencyKey(
        session.tenant.id,
        idempotencyKey,
      );

      if (existing) {
        return assertStockIdempotencyReplay(existing, requestHash ?? "");
      }
    }

    if (error instanceof Error && error.message.includes("Insufficient stock")) {
      throw new StockError("insufficient_stock", "Insufficient stock for movement.", 409);
    }

    throw error;
  }
}

export async function findStockItemForSession(
  sessionToken: string | undefined,
  sku: string,
): Promise<StockItem | undefined> {
  const session = await requirePermission(sessionToken, "inventory.read");

  return findStockItemBySku(session.tenant.id, sku);
}
