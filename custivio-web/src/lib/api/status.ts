import { apiRequest } from "./client";
import type { ApiResult } from "./types";

export type DependencyStatus = {
  name: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export type LiveHealthResponse = {
  status: "ok";
  service: string;
  checkedAt: string;
  requestId: string;
};

export type ReadyHealthResponse = {
  status: "ready" | "not_ready";
  dependencies: DependencyStatus[];
  checkedAt: string;
  requestId: string;
};

export type OpsStatusResponse = {
  service: string;
  environment: string;
  operationalStatus: "ready" | "not_ready";
  dependencies: DependencyStatus[];
  checkedAt: string;
  runbooks: {
    backupRestore: string;
    observability: string;
  };
  requestId: string;
};

export function getLiveHealth(): Promise<ApiResult<LiveHealthResponse>> {
  return apiRequest({ method: "GET", path: "/api/health/live" });
}

export function getReadyHealth(): Promise<ApiResult<ReadyHealthResponse>> {
  return apiRequest({ method: "GET", path: "/api/health/ready" });
}

export function getOpsStatus(): Promise<ApiResult<OpsStatusResponse>> {
  return apiRequest({ method: "GET", path: "/api/ops/status" });
}

export function getMetricsText(): Promise<ApiResult<string>> {
  return apiRequest<string>({
    method: "GET",
    path: "/api/metrics",
    expect: "text",
  });
}

export function getOpenApiDocument(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: "GET", path: "/api/openapi.json" });
}
