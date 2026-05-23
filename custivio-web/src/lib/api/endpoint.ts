import { getApiBaseUrl } from "./config";
import { toQueryString } from "./query-string";
import type { QueryValue } from "./types";

export function buildApiUrl(input: {
  path: string;
  pathParams?: Record<string, string | number>;
  query?: Record<string, QueryValue>;
  baseUrl?: string;
}): string {
  const path = applyPathParams(input.path, input.pathParams);
  return `${input.baseUrl ?? getApiBaseUrl()}${path}${toQueryString(input.query)}`;
}

export function applyPathParams(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;

  return Object.entries(params).reduce(
    (current, [key, value]) =>
      current
        .replaceAll(`:${key}`, encodeURIComponent(String(value)))
        .replaceAll(`{${key}}`, encodeURIComponent(String(value))),
    path,
  );
}
