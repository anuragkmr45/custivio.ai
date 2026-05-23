import { apiRequest } from "./client";
import type { ApiRecord } from "./records";
import type { ApiResult } from "./types";

export type MaintenanceTicket = ApiRecord & {
  assetId?: string;
  openedByUserId?: string;
  assignedToUserId?: string | null;
  status?: string;
  priority?: string;
  issueSummary?: string;
  resolutionSummary?: string | null;
  openedAt?: string;
  resolvedAt?: string | null;
  downtimeMinutes?: number;
};

export type AssetWarranty = ApiRecord & {
  assetId?: string;
  provider?: string;
  contractNumber?: string | null;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  notes?: string | null;
};

export type CreateMaintenanceTicketRequest = {
  assetId: string;
  assignedToUserId?: string;
  issueSummary: string;
  priority?: string;
};

export type UpdateMaintenanceStatusRequest = {
  status: "in_progress" | "resolved" | "cancelled";
  note?: string;
  resolutionSummary?: string;
  downtimeMinutes?: number;
};

export type CreateWarrantyRequest = {
  assetId: string;
  provider: string;
  contractNumber?: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  status?: string;
};

export function listMaintenanceTickets(): Promise<ApiResult<{ tickets: MaintenanceTicket[] }>> {
  return apiRequest({ method: "GET", path: "/api/maintenance/tickets" });
}

export function createMaintenanceTicket(
  body: CreateMaintenanceTicketRequest,
): Promise<ApiResult<{ ticket: MaintenanceTicket }>> {
  return apiRequest({ method: "POST", path: "/api/maintenance/tickets", body });
}

export function updateMaintenanceTicketStatus(
  id: string,
  body: UpdateMaintenanceStatusRequest,
): Promise<ApiResult<{ ticket: MaintenanceTicket }>> {
  return apiRequest({
    method: "POST",
    path: "/api/maintenance/tickets/{id}/status",
    pathParams: { id },
    body,
  });
}

export function listWarranties(): Promise<ApiResult<{ warranties: AssetWarranty[] }>> {
  return apiRequest({ method: "GET", path: "/api/maintenance/warranties" });
}

export function createWarranty(
  body: CreateWarrantyRequest,
): Promise<ApiResult<{ warranty: AssetWarranty }>> {
  return apiRequest({ method: "POST", path: "/api/maintenance/warranties", body });
}
