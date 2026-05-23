import { apiRequest } from "./client";
import type { ApiRecord } from "./records";
import type { ApiResult } from "./types";

export type StockUnit = ApiRecord & {
  code?: string;
  name?: string;
  status?: string;
};

export type StockItem = ApiRecord & {
  unitId?: string;
  sku?: string;
  name?: string;
  itemType?: string;
  status?: string;
  lowStockThreshold?: number;
};

export type StockBalance = ApiRecord & {
  stockItemId?: string;
  locationKey?: string;
  quantityOnHand?: number;
};

export type StockLedgerEntry = ApiRecord & {
  stockItemId?: string;
  movementType?: "receive" | "issue" | "transfer" | "adjust" | string;
  quantity?: number;
  fromLocationKey?: string | null;
  toLocationKey?: string | null;
  referenceId?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string;
};

export type StockOverview = {
  units: StockUnit[];
  items: StockItem[];
  balances: StockBalance[];
  ledger: StockLedgerEntry[];
  lowStock: StockBalance[];
};

export type CreateStockUnitRequest = {
  code: string;
  name: string;
};

export type CreateStockItemRequest = {
  unitId: string;
  sku: string;
  name: string;
  itemType?: string;
  lowStockThreshold?: number;
};

export type CreateStockMovementRequest = {
  stockItemId: string;
  movementType: "receive" | "issue" | "transfer" | "adjust";
  quantity: number;
  fromLocationKey?: string;
  toLocationKey?: string;
  reason?: string;
  referenceId?: string;
  idempotencyKey?: string;
};

export function getStockOverview(): Promise<ApiResult<StockOverview>> {
  return apiRequest({ method: "GET", path: "/api/stock/items" });
}

export function createStockUnit(
  body: CreateStockUnitRequest,
): Promise<ApiResult<{ unit: StockUnit }>> {
  return apiRequest({ method: "POST", path: "/api/stock/units", body });
}

export function createStockItem(
  body: CreateStockItemRequest,
): Promise<ApiResult<{ item: StockItem }>> {
  return apiRequest({ method: "POST", path: "/api/stock/items", body });
}

export function createStockMovement(
  body: CreateStockMovementRequest,
): Promise<ApiResult<{ ledger: StockLedgerEntry }>> {
  return apiRequest({
    method: "POST",
    path: "/api/stock/movements",
    body,
    idempotencyKey: body.idempotencyKey,
  });
}
