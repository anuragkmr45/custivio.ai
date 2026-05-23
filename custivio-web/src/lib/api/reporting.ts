import { apiRequest } from "./client";
import type { ApiRecord } from "./records";
import type { ApiResult } from "./types";

export type AuditCampaign = ApiRecord & {
  name?: string;
  scope?: string;
  status?: string;
  plannedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
};

export type AuditScanResult = ApiRecord & {
  campaignId?: string;
  assetId?: string | null;
  scanCode?: string;
  resultStatus?: string;
  notes?: string | null;
  findingDescription?: string | null;
  severity?: string | null;
};

export type ImportJob = ApiRecord & {
  importType?: string;
  status?: string;
  originalFilename?: string;
  totalRows?: number;
  processedRows?: number;
  failedRows?: number;
  idempotencyKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ExportJob = ApiRecord & {
  exportType?: string;
  status?: string;
  filename?: string;
  contentLength?: number | null;
  checksumSha256?: string | null;
  filters?: Record<string, unknown>;
  idempotencyKey?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SavedFilter = ApiRecord & {
  module?: string;
  key?: string;
  name?: string;
  filters?: Record<string, unknown>;
  createdAt?: string;
};

export type CreateAuditCampaignRequest = {
  name: string;
  scope?: string;
  plannedAt?: string;
};

export type RecordAuditScanRequest = {
  campaignId: string;
  assetId?: string;
  scanCode: string;
  resultStatus: string;
  notes?: string;
  findingDescription?: string;
  severity?: string;
};

export type CreateImportPreviewRequest = {
  importType: string;
  originalFilename: string;
  rows: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
};

export type CreateExportJobRequest = {
  exportType: string;
  filters?: Record<string, unknown>;
  idempotencyKey?: string;
};

export type CreateSavedFilterRequest = {
  module: string;
  key: string;
  name: string;
  filters?: Record<string, unknown>;
};

export function listAuditCampaigns(): Promise<ApiResult<{ campaigns: AuditCampaign[] }>> {
  return apiRequest({ method: "GET", path: "/api/audits/campaigns" });
}

export function createAuditCampaign(
  body: CreateAuditCampaignRequest,
): Promise<ApiResult<{ campaign: AuditCampaign }>> {
  return apiRequest({ method: "POST", path: "/api/audits/campaigns", body });
}

export function recordAuditScan(
  body: RecordAuditScanRequest,
): Promise<ApiResult<{ scan: AuditScanResult }>> {
  return apiRequest({ method: "POST", path: "/api/audits/scans", body });
}

export function listImportJobs(): Promise<ApiResult<{ importJobs: ImportJob[] }>> {
  return apiRequest({ method: "GET", path: "/api/imports/jobs" });
}

export function createImportPreview(
  body: CreateImportPreviewRequest,
): Promise<ApiResult<{ preview: { job: ImportJob; rows: ApiRecord[] } }>> {
  return apiRequest({
    method: "POST",
    path: "/api/imports/jobs",
    body,
    idempotencyKey: body.idempotencyKey,
  });
}

export function processImportJob(id: string): Promise<ApiResult<{ job: ImportJob }>> {
  return apiRequest({
    method: "POST",
    path: "/api/imports/jobs/{id}/process",
    pathParams: { id },
  });
}

export function listExportJobs(): Promise<ApiResult<{ exportJobs: ExportJob[] }>> {
  return apiRequest({ method: "GET", path: "/api/reports/exports" });
}

export function createExportJob(
  body: CreateExportJobRequest,
): Promise<ApiResult<{ exportJob: ExportJob }>> {
  return apiRequest({
    method: "POST",
    path: "/api/reports/exports",
    body,
    idempotencyKey: body.idempotencyKey,
  });
}

export function downloadExportJob(exportId: string): Promise<ApiResult<Blob>> {
  return apiRequest<Blob>({
    method: "GET",
    path: "/api/reports/exports/{exportId}/download",
    pathParams: { exportId },
    expect: "blob",
  });
}

export function listSavedFilters(): Promise<ApiResult<{ savedFilters: SavedFilter[] }>> {
  return apiRequest({ method: "GET", path: "/api/reports/filters" });
}

export function createSavedFilter(
  body: CreateSavedFilterRequest,
): Promise<ApiResult<{ filter: SavedFilter }>> {
  return apiRequest({ method: "POST", path: "/api/reports/filters", body });
}
