const DEFAULT_API_BASE_URL = "http://localhost:3000";

export function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;
  return normalizeBaseUrl(value || DEFAULT_API_BASE_URL);
}

export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}
