import { apiRequest } from "./client";
import { uploadFile } from "./upload";
import type { ApiRecord } from "./records";
import type { ApiResult, PageInfo } from "./types";

export type AssetRecord = ApiRecord & {
  assetTypeId?: string;
  modelId?: string | null;
  vendorId?: string | null;
  siteId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  roomId?: string | null;
  rackId?: string | null;
  shelfId?: string | null;
  binId?: string | null;
  assetTag?: string;
  serialNumber?: string | null;
  name?: string;
  status?: string;
  condition?: string;
  custodianUserId?: string | null;
  customFields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AssetAttachment = ApiRecord & {
  assetId?: string;
  filename?: string;
  contentType?: string;
  contentLength?: number | null;
  checksumSha256?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AssetLifecycleEvent = ApiRecord & {
  assetId?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type AssetDetail = {
  asset: AssetRecord;
  identifiers: ApiRecord[];
  attachments: AssetAttachment[];
  lifecycleEvents: AssetLifecycleEvent[];
  qrPayload: string;
};

export type CreateAssetRequest = {
  assetTypeId: string;
  modelId?: string;
  vendorId?: string;
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  rackId?: string;
  shelfId?: string;
  binId?: string;
  custodianUserId?: string;
  assetTag: string;
  serialNumber?: string;
  name: string;
  status?: string;
  condition?: string;
  customFields?: Record<string, unknown>;
};

export type PatchAssetRequest = {
  assetTypeId?: string;
  modelId?: string;
  vendorId?: string;
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  rackId?: string;
  shelfId?: string;
  binId?: string;
  custodianUserId?: string;
  serialNumber?: string;
  name?: string;
  status?: string;
  condition?: string;
  customFields?: Record<string, unknown>;
};

export type ListAssetsQuery = {
  q?: string;
  limit?: number;
  offset?: number;
};

export type ListAssetsResponse = {
  assets: AssetRecord[];
  pageInfo?: PageInfo;
};

export function listAssets(query?: ListAssetsQuery): Promise<ApiResult<ListAssetsResponse>> {
  return apiRequest({
    method: "GET",
    path: "/api/assets",
    query,
  });
}

export function createAsset(body: CreateAssetRequest): Promise<ApiResult<{ asset: AssetRecord }>> {
  return apiRequest({ method: "POST", path: "/api/assets", body });
}

export function getAssetDetail(id: string): Promise<ApiResult<{ detail: AssetDetail }>> {
  return apiRequest({
    method: "GET",
    path: "/api/assets/{id}",
    pathParams: { id },
  });
}

export function updateAsset(
  id: string,
  body: PatchAssetRequest,
): Promise<ApiResult<{ asset: AssetRecord }>> {
  return apiRequest({
    method: "PATCH",
    path: "/api/assets/{id}",
    pathParams: { id },
    body,
  });
}

export function addAssetLifecycleEvent(
  id: string,
  body: { eventType: string; metadata?: Record<string, unknown> },
): Promise<ApiResult<{ event: AssetLifecycleEvent }>> {
  return apiRequest({
    method: "POST",
    path: "/api/assets/{id}/lifecycle",
    pathParams: { id },
    body,
  });
}

export function uploadAssetAttachment(
  id: string,
  file: File | Blob,
  filename?: string,
): Promise<ApiResult<{ attachment: AssetAttachment }>> {
  return uploadFile({
    path: "/api/assets/{id}/attachments",
    pathParams: { id },
    file,
    filename,
  });
}

export function downloadAssetAttachment(
  id: string,
  attachmentId: string,
): Promise<ApiResult<Blob>> {
  return apiRequest<Blob>({
    method: "GET",
    path: "/api/assets/{id}/attachments/{attachmentId}/download",
    pathParams: { id, attachmentId },
    expect: "blob",
  });
}

export function deleteAssetAttachment(
  id: string,
  attachmentId: string,
): Promise<ApiResult<{ attachment: AssetAttachment }>> {
  return apiRequest({
    method: "DELETE",
    path: "/api/assets/{id}/attachments/{attachmentId}",
    pathParams: { id, attachmentId },
  });
}
