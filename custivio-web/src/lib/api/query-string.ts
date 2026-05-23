import type { QueryValue } from "./types";

export function toQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return "";

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        appendValue(params, key, item);
      }
      continue;
    }

    appendValue(params, key, value);
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function appendValue(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined,
) {
  if (value === undefined || value === null) return;
  params.append(key, String(value));
}
