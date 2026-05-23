import { CopyableId } from "@/components/data/CopyableId";
import type { AdminUser } from "@/lib/api/admin";
import type { AssetRecord } from "@/lib/api/assets";
import type { ApiRecord } from "@/lib/api/records";
import {
  formatLocationLabel,
  formatRecordLabel,
  formatUserLabel,
  type AssetReferenceLookups,
} from "@/lib/asset-display";

export function RelatedRecordValue({
  map,
  id,
  label,
  fallback = "Not set",
}: {
  map: Map<string, ApiRecord>;
  id: string | null | undefined;
  label: string;
  fallback?: string;
}) {
  if (!id) return <span className="text-muted-foreground">{fallback}</span>;

  const record = map.get(id);
  if (record) return <span>{formatRecordLabel(record)}</span>;

  return <CopyableId value={id} label={label} />;
}

export function CustodianValue({
  users,
  id,
  fallback = "Unassigned",
}: {
  users: Map<string, AdminUser>;
  id: string | null | undefined;
  fallback?: string;
}) {
  if (!id) return <span className="text-muted-foreground">{fallback}</span>;

  const user = users.get(id);
  if (user) return <span>{formatUserLabel(user)}</span>;

  return <CopyableId value={id} label="Custodian user ID" />;
}

export function AssetLocationValue({
  asset,
  lookups,
}: {
  asset: AssetRecord;
  lookups: AssetReferenceLookups;
}) {
  const parts = [
    locationPart(lookups.sites, asset.siteId, "Site ID"),
    locationPart(lookups.buildings, asset.buildingId, "Building ID"),
    locationPart(lookups.floors, asset.floorId, "Floor ID"),
    locationPart(lookups.rooms, asset.roomId, "Room ID"),
    locationPart(lookups.racks, asset.rackId, "Rack ID"),
    locationPart(lookups.shelves, asset.shelfId, "Shelf ID"),
    locationPart(lookups.bins, asset.binId, "Bin ID"),
  ].filter((part): part is NonNullable<ReturnType<typeof locationPart>> => Boolean(part));

  if (parts.length === 0) {
    return <span className="text-muted-foreground">Not assigned</span>;
  }

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
      {parts.map((part, index) => (
        <span key={`${part.key}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 && <span className="text-muted-foreground">/</span>}
          {part.node}
        </span>
      ))}
    </span>
  );
}

function locationPart(map: Map<string, ApiRecord>, id: string | null | undefined, label: string) {
  if (!id) return null;

  const record = map.get(id);

  return {
    key: id,
    node: record ? (
      <span>{formatLocationLabel(record)}</span>
    ) : (
      <CopyableId value={id} label={label} />
    ),
  };
}
