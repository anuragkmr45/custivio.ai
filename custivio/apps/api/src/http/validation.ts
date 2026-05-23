import { HttpApiError } from "./errors";

export function readRecordBody(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

export function readStringField(source: Record<string, unknown>, key: string): string {
  const value = source[key];

  return typeof value === "string" ? value : "";
}

export function requireParam(params: unknown, key: string): string {
  if (!params || typeof params !== "object") {
    throw new HttpApiError("invalid_request", `${key} is required.`, 400);
  }

  const value = (params as Record<string, unknown>)[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpApiError("invalid_request", `${key} is required.`, 400);
  }

  return value;
}

export function readOptionalQueryString(query: unknown, key: string): string | undefined {
  if (!query || typeof query !== "object") {
    return undefined;
  }

  const value = (query as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export function readOptionalQueryInteger(query: unknown, key: string): number | undefined {
  if (!query || typeof query !== "object") {
    return undefined;
  }

  const value = (query as Record<string, unknown>)[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isInteger(parsed)) {
    throw new HttpApiError("invalid_request", `${key} must be an integer.`, 400);
  }

  return parsed;
}
