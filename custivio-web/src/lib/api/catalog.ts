import { apiRequest } from "./client";
import type { ApiRecord, CatalogResource } from "./records";
import type { ApiResult } from "./types";

export type CatalogRecord = ApiRecord;

export function listCatalogRecords(
  resource: CatalogResource,
): Promise<ApiResult<{ records: CatalogRecord[] }>> {
  return apiRequest({
    method: "GET",
    path: "/api/catalog/{resource}",
    pathParams: { resource },
  });
}

export function createCatalogRecord(
  resource: CatalogResource,
  body: Record<string, unknown>,
): Promise<ApiResult<{ record: CatalogRecord }>> {
  return apiRequest({
    method: "POST",
    path: "/api/catalog/{resource}",
    pathParams: { resource },
    body,
  });
}

export function updateCatalogRecord(
  resource: CatalogResource,
  id: string,
  body: Record<string, unknown>,
): Promise<ApiResult<{ record: CatalogRecord }>> {
  return apiRequest({
    method: "PATCH",
    path: "/api/catalog/{resource}/{id}",
    pathParams: { resource, id },
    body,
  });
}

export function archiveCatalogRecord(
  resource: CatalogResource,
  id: string,
): Promise<ApiResult<{ record: CatalogRecord }>> {
  return apiRequest({
    method: "DELETE",
    path: "/api/catalog/{resource}/{id}",
    pathParams: { resource, id },
  });
}
