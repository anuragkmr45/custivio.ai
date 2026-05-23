export type ApiRecord = {
  id: string;
  [key: string]: unknown;
};

export type CatalogResource =
  | "categories"
  | "types"
  | "custom-fields"
  | "manufacturers"
  | "models"
  | "vendors";

export type LocationResource =
  | "sites"
  | "buildings"
  | "floors"
  | "rooms"
  | "racks"
  | "shelves"
  | "bins";

export const catalogResources: CatalogResource[] = [
  "categories",
  "types",
  "custom-fields",
  "manufacturers",
  "models",
  "vendors",
];

export const locationResources: LocationResource[] = [
  "sites",
  "buildings",
  "floors",
  "rooms",
  "racks",
  "shelves",
  "bins",
];

export function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function textField(
  record: Record<string, unknown> | null | undefined,
  keys: string | string[],
  fallback = "-",
): string {
  if (!record) return fallback;
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }

  return fallback;
}

export function numberField(
  record: Record<string, unknown> | null | undefined,
  keys: string | string[],
  fallback = 0,
): number {
  if (!record) return fallback;
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

export function dateField(
  record: Record<string, unknown> | null | undefined,
  keys: string | string[],
  fallback = "-",
): string {
  const value = textField(record, keys, "");
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export function formatBytes(value: unknown): string {
  const bytes = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
