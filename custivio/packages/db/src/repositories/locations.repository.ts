import { and, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  bins,
  buildings,
  floors,
  racks,
  rooms,
  shelves,
  sites,
  type Bin,
  type Building,
  type Floor,
  type NewBin,
  type NewBuilding,
  type NewFloor,
  type NewRack,
  type NewRoom,
  type NewShelf,
  type NewSite,
  type Rack,
  type Room,
  type Shelf,
  type Site,
} from "../schema";

export async function createSite(
  values: Pick<NewSite, "tenantId" | "code" | "name">,
): Promise<Site> {
  const [site] = await getDb()
    .insert(sites)
    .values({ tenantId: values.tenantId, code: values.code, name: values.name, status: "active" })
    .returning();

  if (!site) {
    throw new Error("Failed to create site.");
  }

  return site;
}

export async function createBuilding(
  values: Pick<NewBuilding, "tenantId" | "siteId" | "code" | "name">,
): Promise<Building> {
  const [building] = await getDb()
    .insert(buildings)
    .values({
      tenantId: values.tenantId,
      siteId: values.siteId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!building) {
    throw new Error("Failed to create building.");
  }

  return building;
}

export async function createFloor(
  values: Pick<NewFloor, "tenantId" | "buildingId" | "code" | "name">,
): Promise<Floor> {
  const [floor] = await getDb()
    .insert(floors)
    .values({
      tenantId: values.tenantId,
      buildingId: values.buildingId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!floor) {
    throw new Error("Failed to create floor.");
  }

  return floor;
}

export async function createRoom(
  values: Pick<NewRoom, "tenantId" | "floorId" | "code" | "name">,
): Promise<Room> {
  const [room] = await getDb()
    .insert(rooms)
    .values({
      tenantId: values.tenantId,
      floorId: values.floorId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!room) {
    throw new Error("Failed to create room.");
  }

  return room;
}

export async function createRack(
  values: Pick<NewRack, "tenantId" | "roomId" | "code" | "name">,
): Promise<Rack> {
  const [rack] = await getDb()
    .insert(racks)
    .values({
      tenantId: values.tenantId,
      roomId: values.roomId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!rack) {
    throw new Error("Failed to create rack.");
  }

  return rack;
}

export async function createShelf(
  values: Pick<NewShelf, "tenantId" | "rackId" | "code" | "name">,
): Promise<Shelf> {
  const [shelf] = await getDb()
    .insert(shelves)
    .values({
      tenantId: values.tenantId,
      rackId: values.rackId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!shelf) {
    throw new Error("Failed to create shelf.");
  }

  return shelf;
}

export async function createBin(
  values: Pick<NewBin, "tenantId" | "code" | "name"> & Partial<Pick<NewBin, "shelfId" | "roomId">>,
): Promise<Bin> {
  const [bin] = await getDb()
    .insert(bins)
    .values({
      tenantId: values.tenantId,
      shelfId: values.shelfId,
      roomId: values.roomId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!bin) {
    throw new Error("Failed to create bin.");
  }

  return bin;
}

export async function listSitesByTenant(tenantId: string): Promise<Site[]> {
  return getDb().select().from(sites).where(eq(sites.tenantId, tenantId));
}

export async function listBuildingsByTenant(tenantId: string): Promise<Building[]> {
  return getDb().select().from(buildings).where(eq(buildings.tenantId, tenantId));
}

export async function listFloorsByTenant(tenantId: string): Promise<Floor[]> {
  return getDb().select().from(floors).where(eq(floors.tenantId, tenantId));
}

export async function listRoomsByTenant(tenantId: string): Promise<Room[]> {
  return getDb().select().from(rooms).where(eq(rooms.tenantId, tenantId));
}

export async function listRacksByTenant(tenantId: string): Promise<Rack[]> {
  return getDb().select().from(racks).where(eq(racks.tenantId, tenantId));
}

export async function listShelvesByTenant(tenantId: string): Promise<Shelf[]> {
  return getDb().select().from(shelves).where(eq(shelves.tenantId, tenantId));
}

export async function listBinsByTenant(tenantId: string): Promise<Bin[]> {
  return getDb().select().from(bins).where(eq(bins.tenantId, tenantId));
}

export async function listRoomsByFloor(tenantId: string, floorId: string): Promise<Room[]> {
  return getDb()
    .select()
    .from(rooms)
    .where(and(eq(rooms.tenantId, tenantId), eq(rooms.floorId, floorId)));
}

export async function updateSite(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewSite, "code" | "name" | "status">>,
): Promise<Site | undefined> {
  const [site] = await getDb()
    .update(sites)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(sites.tenantId, tenantId), eq(sites.id, id)))
    .returning();

  return site;
}

export async function updateBuilding(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewBuilding, "siteId" | "code" | "name" | "status">>,
): Promise<Building | undefined> {
  const [building] = await getDb()
    .update(buildings)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(buildings.tenantId, tenantId), eq(buildings.id, id)))
    .returning();

  return building;
}

export async function updateFloor(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewFloor, "buildingId" | "code" | "name" | "status">>,
): Promise<Floor | undefined> {
  const [floor] = await getDb()
    .update(floors)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(floors.tenantId, tenantId), eq(floors.id, id)))
    .returning();

  return floor;
}

export async function updateRoom(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewRoom, "floorId" | "code" | "name" | "status">>,
): Promise<Room | undefined> {
  const [room] = await getDb()
    .update(rooms)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(rooms.tenantId, tenantId), eq(rooms.id, id)))
    .returning();

  return room;
}

export async function updateRack(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewRack, "roomId" | "code" | "name" | "status">>,
): Promise<Rack | undefined> {
  const [rack] = await getDb()
    .update(racks)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(racks.tenantId, tenantId), eq(racks.id, id)))
    .returning();

  return rack;
}

export async function updateShelf(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewShelf, "rackId" | "code" | "name" | "status">>,
): Promise<Shelf | undefined> {
  const [shelf] = await getDb()
    .update(shelves)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(shelves.tenantId, tenantId), eq(shelves.id, id)))
    .returning();

  return shelf;
}

export async function updateBin(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewBin, "shelfId" | "roomId" | "code" | "name" | "status">>,
): Promise<Bin | undefined> {
  const [bin] = await getDb()
    .update(bins)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(bins.tenantId, tenantId), eq(bins.id, id)))
    .returning();

  return bin;
}
