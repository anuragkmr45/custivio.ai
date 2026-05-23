import { requirePermission } from "@custivio/auth";
import {
  appendAuditLog,
  createBin,
  createBuilding,
  createFloor,
  createRack,
  createRoom,
  createShelf,
  createSite,
  listBinsByTenant,
  listBuildingsByTenant,
  listFloorsByTenant,
  listRacksByTenant,
  listRoomsByTenant,
  listShelvesByTenant,
  listSitesByTenant,
  updateBin,
  updateBuilding,
  updateFloor,
  updateRack,
  updateRoom,
  updateShelf,
  updateSite,
  type Bin,
  type Building,
  type Floor,
  type Rack,
  type Room,
  type Shelf,
  type Site,
} from "@custivio/db";

import { LocationError } from "./errors";

export type LocationResource =
  | "sites"
  | "buildings"
  | "floors"
  | "rooms"
  | "racks"
  | "shelves"
  | "bins";
export type LocationRecord = Site | Building | Floor | Room | Rack | Shelf | Bin;

function readString(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(input: Record<string, unknown>, key: string): string | undefined {
  const value = readString(input, key);

  return value.length > 0 ? value : undefined;
}

function requireString(input: Record<string, unknown>, key: string): string {
  const value = readString(input, key);

  if (value.length === 0) {
    throw new LocationError("invalid_location_input", `${key} is required.`, 400);
  }

  return value;
}

function assertResource(resource: string): asserts resource is LocationResource {
  if (!["sites", "buildings", "floors", "rooms", "racks", "shelves", "bins"].includes(resource)) {
    throw new LocationError("unknown_location_resource", "Location resource is unknown.", 404);
  }
}

async function writeLocationAudit(
  tenantId: string,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  requestId?: string,
): Promise<void> {
  await appendAuditLog({
    tenantId,
    actorUserId,
    action,
    entityType,
    entityId,
    requestId,
  });
}

export async function listLocationsForSession(
  sessionToken: string | undefined,
  resource: string,
): Promise<LocationRecord[]> {
  assertResource(resource);
  const session = await requirePermission(sessionToken, "locations.manage");

  if (resource === "sites") return listSitesByTenant(session.tenant.id);
  if (resource === "buildings") return listBuildingsByTenant(session.tenant.id);
  if (resource === "floors") return listFloorsByTenant(session.tenant.id);
  if (resource === "rooms") return listRoomsByTenant(session.tenant.id);
  if (resource === "racks") return listRacksByTenant(session.tenant.id);
  if (resource === "shelves") return listShelvesByTenant(session.tenant.id);

  return listBinsByTenant(session.tenant.id);
}

export async function createLocationForSession(
  sessionToken: string | undefined,
  resource: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<LocationRecord> {
  assertResource(resource);
  const session = await requirePermission(sessionToken, "locations.manage");
  const common = {
    tenantId: session.tenant.id,
    code: requireString(input, "code"),
    name: requireString(input, "name"),
  };
  const shelfId = readOptionalString(input, "shelfId");
  const roomId = readOptionalString(input, "roomId");
  const binInput: Parameters<typeof createBin>[0] = { ...common };

  if (shelfId) binInput.shelfId = shelfId;
  if (roomId) binInput.roomId = roomId;

  const record =
    resource === "sites"
      ? await createSite(common)
      : resource === "buildings"
        ? await createBuilding({ ...common, siteId: requireString(input, "siteId") })
        : resource === "floors"
          ? await createFloor({ ...common, buildingId: requireString(input, "buildingId") })
          : resource === "rooms"
            ? await createRoom({ ...common, floorId: requireString(input, "floorId") })
            : resource === "racks"
              ? await createRack({ ...common, roomId: requireString(input, "roomId") })
              : resource === "shelves"
                ? await createShelf({ ...common, rackId: requireString(input, "rackId") })
                : await createBin(binInput);

  await writeLocationAudit(
    session.tenant.id,
    session.user.id,
    `location.${resource}.created`,
    resource,
    record.id,
    requestId,
  );

  return record;
}

export async function updateLocationForSession(
  sessionToken: string | undefined,
  resource: string,
  id: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<LocationRecord> {
  assertResource(resource);
  const session = await requirePermission(sessionToken, "locations.manage");
  const patch: { code?: string; name?: string; status?: string } = {};
  const code = readOptionalString(input, "code");
  const name = readOptionalString(input, "name");
  const status = readOptionalString(input, "status");

  if (code) patch.code = code;
  if (name) patch.name = name;
  if (status) patch.status = status;

  const buildingPatch: Parameters<typeof updateBuilding>[2] = { ...patch };
  const floorPatch: Parameters<typeof updateFloor>[2] = { ...patch };
  const roomPatch: Parameters<typeof updateRoom>[2] = { ...patch };
  const rackPatch: Parameters<typeof updateRack>[2] = { ...patch };
  const shelfPatch: Parameters<typeof updateShelf>[2] = { ...patch };
  const binPatch: Parameters<typeof updateBin>[2] = { ...patch };
  const siteId = readOptionalString(input, "siteId");
  const buildingId = readOptionalString(input, "buildingId");
  const floorId = readOptionalString(input, "floorId");
  const updateRoomId = readOptionalString(input, "roomId");
  const rackId = readOptionalString(input, "rackId");
  const updateShelfId = readOptionalString(input, "shelfId");

  if (siteId) buildingPatch.siteId = siteId;
  if (buildingId) floorPatch.buildingId = buildingId;
  if (floorId) roomPatch.floorId = floorId;
  if (updateRoomId) rackPatch.roomId = updateRoomId;
  if (rackId) shelfPatch.rackId = rackId;
  if (updateShelfId) binPatch.shelfId = updateShelfId;
  if (updateRoomId) binPatch.roomId = updateRoomId;

  const record =
    resource === "sites"
      ? await updateSite(session.tenant.id, id, patch)
      : resource === "buildings"
        ? await updateBuilding(session.tenant.id, id, buildingPatch)
        : resource === "floors"
          ? await updateFloor(session.tenant.id, id, floorPatch)
          : resource === "rooms"
            ? await updateRoom(session.tenant.id, id, roomPatch)
            : resource === "racks"
              ? await updateRack(session.tenant.id, id, rackPatch)
              : resource === "shelves"
                ? await updateShelf(session.tenant.id, id, shelfPatch)
                : await updateBin(session.tenant.id, id, binPatch);

  if (!record) {
    throw new LocationError("location_not_found", "Location record was not found.", 404);
  }

  await writeLocationAudit(
    session.tenant.id,
    session.user.id,
    `location.${resource}.updated`,
    resource,
    record.id,
    requestId,
  );

  return record;
}

export async function archiveLocationForSession(
  sessionToken: string | undefined,
  resource: string,
  id: string,
  requestId?: string,
): Promise<LocationRecord> {
  return updateLocationForSession(sessionToken, resource, id, { status: "archived" }, requestId);
}
