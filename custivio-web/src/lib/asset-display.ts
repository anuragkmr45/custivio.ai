import type { AdminUser } from "@/lib/api/admin";
import type { AssetRecord } from "@/lib/api/assets";
import { textField, type ApiRecord } from "@/lib/api/records";

export type SelectOption = {
  value: string;
  label: string;
};

export type AssetReferenceData = {
  types: ApiRecord[];
  models: ApiRecord[];
  vendors: ApiRecord[];
  customFields: ApiRecord[];
  sites: ApiRecord[];
  buildings: ApiRecord[];
  floors: ApiRecord[];
  rooms: ApiRecord[];
  racks: ApiRecord[];
  shelves: ApiRecord[];
  bins: ApiRecord[];
  users: AdminUser[];
};

export type AssetReferenceLookups = {
  types: Map<string, ApiRecord>;
  models: Map<string, ApiRecord>;
  vendors: Map<string, ApiRecord>;
  customFields: Map<string, ApiRecord>;
  sites: Map<string, ApiRecord>;
  buildings: Map<string, ApiRecord>;
  floors: Map<string, ApiRecord>;
  rooms: Map<string, ApiRecord>;
  racks: Map<string, ApiRecord>;
  shelves: Map<string, ApiRecord>;
  bins: Map<string, ApiRecord>;
  users: Map<string, AdminUser>;
};

export const emptyAssetReferenceData: AssetReferenceData = {
  types: [],
  models: [],
  vendors: [],
  customFields: [],
  sites: [],
  buildings: [],
  floors: [],
  rooms: [],
  racks: [],
  shelves: [],
  bins: [],
  users: [],
};

export function buildAssetReferenceLookups(
  data: Partial<AssetReferenceData> | null | undefined,
): AssetReferenceLookups {
  return {
    types: mapById(data?.types),
    models: mapById(data?.models),
    vendors: mapById(data?.vendors),
    customFields: mapById(data?.customFields),
    sites: mapById(data?.sites),
    buildings: mapById(data?.buildings),
    floors: mapById(data?.floors),
    rooms: mapById(data?.rooms),
    racks: mapById(data?.racks),
    shelves: mapById(data?.shelves),
    bins: mapById(data?.bins),
    users: mapById(data?.users),
  };
}

export function recordOption(record: ApiRecord): SelectOption {
  return {
    value: String(record.id ?? ""),
    label: formatRecordLabel(record),
  };
}

export function locationOption(record: ApiRecord): SelectOption {
  return {
    value: String(record.id ?? ""),
    label: formatLocationLabel(record),
  };
}

export function userOption(user: AdminUser): SelectOption {
  return {
    value: user.id,
    label: formatUserLabel(user),
  };
}

export function uniqueOptions(options: SelectOption[]): SelectOption[] {
  const seenValues = new Set<string>();
  const seenLabels = new Set<string>();
  const result: SelectOption[] = [];

  for (const option of options) {
    const value = option.value.trim();
    const label = option.label.trim();
    const normalizedLabel = label.toLowerCase();

    if (!value || !label || seenValues.has(value) || seenLabels.has(normalizedLabel)) {
      continue;
    }

    seenValues.add(value);
    seenLabels.add(normalizedLabel);
    result.push({ value, label });
  }

  return result;
}

export function formatRecordLabel(record: ApiRecord | undefined | null, fallback = "Unavailable") {
  if (!record) return fallback;

  const name = textField(record, ["name", "label", "displayName"], "");
  const key = textField(record, ["key", "code"], "");
  const modelNumber = textField(record, "modelNumber", "");

  if (name && key && name !== key) return `${name} (${key})`;
  if (name && modelNumber) return `${name} (${modelNumber})`;
  if (name) return name;
  if (key) return key;

  return fallback;
}

export function formatLocationLabel(
  record: ApiRecord | undefined | null,
  fallback = "Unavailable",
) {
  if (!record) return fallback;

  const code = textField(record, "code", "");
  const name = textField(record, "name", "");

  if (code && name && code !== name) return `${code} - ${name}`;
  if (name) return name;
  if (code) return code;

  return fallback;
}

export function formatUserLabel(user: AdminUser | ApiRecord | undefined | null) {
  if (!user) return "Unassigned";

  const displayName = textField(user, ["displayName", "name"], "");
  const email = textField(user, "email", "");

  if (displayName && email) return `${displayName} (${email})`;
  if (displayName) return displayName;
  if (email) return email;

  return "Unassigned";
}

export function formatRelatedRecord(
  map: Map<string, ApiRecord>,
  id: string | null | undefined,
  fallback = "Not set",
) {
  if (!id) return fallback;

  return formatRecordLabel(map.get(id), "Reference unavailable");
}

export function formatCustodian(
  lookups: AssetReferenceLookups,
  id: string | null | undefined,
  fallback = "Unassigned",
) {
  if (!id) return fallback;

  return lookups.users.has(id) ? formatUserLabel(lookups.users.get(id)) : "Reference unavailable";
}

export function formatAssetLocation(asset: AssetRecord, lookups: AssetReferenceLookups) {
  const parts = [
    locationPart(lookups.sites, asset.siteId),
    locationPart(lookups.buildings, asset.buildingId),
    locationPart(lookups.floors, asset.floorId),
    locationPart(lookups.rooms, asset.roomId),
    locationPart(lookups.racks, asset.rackId),
    locationPart(lookups.shelves, asset.shelfId),
    locationPart(lookups.bins, asset.binId),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Not assigned";
}

export function filterByParent<T extends ApiRecord>(
  records: T[],
  parentKey: string,
  parentId: string,
  selectedId = "",
): T[] {
  if (!parentId) return records;

  return records.filter(
    (record) => textField(record, parentKey, "") === parentId || String(record.id) === selectedId,
  );
}

export function customFieldsForAssetType(fields: ApiRecord[], assetTypeId: string): ApiRecord[] {
  if (!assetTypeId) return [];

  return fields.filter((field) => textField(field, "assetTypeId", "") === assetTypeId);
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function formatTechnicalId(value: string | null | undefined) {
  if (!value) return "Not set";
  if (!isUuidLike(value)) return value;

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function locationPart(map: Map<string, ApiRecord>, id: string | null | undefined) {
  if (!id) return "";

  return formatLocationLabel(map.get(id), "Reference unavailable");
}

function mapById<T extends { id?: unknown }>(records: T[] | null | undefined) {
  const map = new Map<string, T>();

  for (const record of records ?? []) {
    const id = String(record.id ?? "");
    if (id && !map.has(id)) map.set(id, record);
  }

  return map;
}
