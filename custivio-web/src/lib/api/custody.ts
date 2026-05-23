import { apiRequest } from "./client";
import type { AssetRecord } from "./assets";
import type { AdminUser } from "./admin";
import type { ApiRecord } from "./records";
import type { ApiResult } from "./types";

export type CustodyAssignment = ApiRecord & {
  assetId?: string;
  assignedToUserId?: string;
  assignedByUserId?: string;
  checkedOutAt?: string;
  dueAt?: string | null;
  checkedInAt?: string | null;
  status?: string;
  notes?: string | null;
};

export type TransferRequest = ApiRecord & {
  assetId?: string;
  fromCustodianUserId?: string | null;
  toCustodianUserId?: string;
  requestedByUserId?: string;
  decidedByUserId?: string | null;
  status?: string;
  reason?: string | null;
  decisionNote?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CustodyOverview = {
  assets: AssetRecord[];
  users: AdminUser[];
  assignments: CustodyAssignment[];
  transfers: TransferRequest[];
};

export type CheckoutAssetRequest = {
  assetId: string;
  assignedToUserId: string;
  dueAt?: string;
  notes?: string;
};

export type CheckInAssetRequest = {
  assignmentId: string;
  notes?: string;
};

export type HandoverAssetRequest = {
  assignmentId: string;
  toUserId: string;
  notes?: string;
};

export type CreateTransferRequest = {
  assetId: string;
  toCustodianUserId: string;
  reason?: string;
};

export type DecideTransferRequest = {
  decision: "approved" | "rejected";
  decisionNote?: string;
};

export function getCustodyOverview(): Promise<ApiResult<CustodyOverview>> {
  return apiRequest({ method: "GET", path: "/api/custody/checkouts" });
}

export function checkoutAsset(
  body: CheckoutAssetRequest,
): Promise<ApiResult<{ assignment: CustodyAssignment }>> {
  return apiRequest({ method: "POST", path: "/api/custody/checkouts", body });
}

export function checkInAsset(
  body: CheckInAssetRequest,
): Promise<ApiResult<{ assignment: CustodyAssignment }>> {
  return apiRequest({ method: "POST", path: "/api/custody/checkins", body });
}

export function handoverAsset(
  body: HandoverAssetRequest,
): Promise<ApiResult<{ assignment: CustodyAssignment }>> {
  return apiRequest({ method: "POST", path: "/api/custody/handovers", body });
}

export function listTransfers(): Promise<ApiResult<{ transfers: TransferRequest[] }>> {
  return apiRequest({ method: "GET", path: "/api/transfers" });
}

export function createTransfer(
  body: CreateTransferRequest,
): Promise<ApiResult<{ transfer: TransferRequest }>> {
  return apiRequest({ method: "POST", path: "/api/transfers", body });
}

export function decideTransfer(
  id: string,
  body: DecideTransferRequest,
): Promise<ApiResult<{ transfer: TransferRequest }>> {
  return apiRequest({
    method: "POST",
    path: "/api/transfers/{id}/decision",
    pathParams: { id },
    body,
  });
}
