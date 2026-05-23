import { apiRequest } from "./client";
import type { ApiRecord, LocationResource } from "./records";
import type { ApiResult } from "./types";

export type LocationRecord = ApiRecord;

export function listLocationRecords(
  resource: LocationResource,
): Promise<ApiResult<{ records: LocationRecord[] }>> {
  return apiRequest({
    method: "GET",
    path: "/api/locations/{resource}",
    pathParams: { resource },
  });
}

export function createLocationRecord(
  resource: LocationResource,
  body: Record<string, unknown>,
): Promise<ApiResult<{ record: LocationRecord }>> {
  return apiRequest({
    method: "POST",
    path: "/api/locations/{resource}",
    pathParams: { resource },
    body,
  });
}

export function updateLocationRecord(
  resource: LocationResource,
  id: string,
  body: Record<string, unknown>,
): Promise<ApiResult<{ record: LocationRecord }>> {
  return apiRequest({
    method: "PATCH",
    path: "/api/locations/{resource}/{id}",
    pathParams: { resource, id },
    body,
  });
}

export function archiveLocationRecord(
  resource: LocationResource,
  id: string,
): Promise<ApiResult<{ record: LocationRecord }>> {
  return apiRequest({
    method: "DELETE",
    path: "/api/locations/{resource}/{id}",
    pathParams: { resource, id },
  });
}
