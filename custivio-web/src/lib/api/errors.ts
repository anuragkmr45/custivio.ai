import type { ApiErrorEnvelope, ApiResult } from "./types";

type ApiFailure = Extract<ApiResult<never>, { ok: false }>;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  readonly raw?: unknown;

  constructor(result: ApiFailure) {
    super(result.message);
    this.name = "ApiClientError";
    this.status = result.status;
    this.code = result.code;
    this.requestId = result.requestId;
    this.retryAfterSeconds = result.retryAfterSeconds;
    this.raw = result.raw;
  }
}

export function throwApiError(result: ApiFailure): never {
  throw new ApiClientError(result);
}

export function unwrapApiResult<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throwApiError(result as ApiFailure);
}

export function isBackendUnavailableError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 0 && error.code === "network_error";
}

export async function toApiError<T>(
  response: Response,
  requestIdFromHeader?: string,
): Promise<ApiResult<T>> {
  const raw = await readErrorBody(response);
  const envelope = isRecord(raw) ? (raw as ApiErrorEnvelope) : undefined;
  const error = envelope?.error;
  const retryAfter = response.headers.get("retry-after");
  const requestId = requestIdFromHeader ?? error?.requestId;

  return {
    ok: false,
    status: response.status,
    code: error?.code || defaultErrorCode(response.status),
    message: error?.message || response.statusText || "Request failed.",
    requestId,
    retryAfterSeconds: retryAfter ? Number(retryAfter) : undefined,
    raw,
  };
}

async function readErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

function defaultErrorCode(status: number): string {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "bad_request";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
