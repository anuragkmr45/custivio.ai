import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "../client";
import {
  assetIdentifiers,
  assetAttachments,
  assetLifecycleEvents,
  assets,
  type Asset,
  type AssetAttachment,
  type AssetIdentifier,
  type AssetLifecycleEvent,
  type NewAsset,
  type NewAssetAttachment,
  type NewAssetIdentifier,
  type NewAssetLifecycleEvent,
} from "../schema";

export interface ListAssetsOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AssetListPage {
  assets: Asset[];
  total: number;
  limit: number;
  offset: number;
}

export async function createAsset(
  values: Pick<NewAsset, "tenantId" | "assetTypeId" | "assetTag" | "name"> &
    Partial<
      Pick<
        NewAsset,
        | "modelId"
        | "vendorId"
        | "siteId"
        | "buildingId"
        | "floorId"
        | "roomId"
        | "rackId"
        | "shelfId"
        | "binId"
        | "custodianUserId"
        | "serialNumber"
        | "status"
        | "condition"
        | "customFields"
      >
    >,
): Promise<Asset> {
  const [asset] = await getDb()
    .insert(assets)
    .values({
      tenantId: values.tenantId,
      assetTypeId: values.assetTypeId,
      modelId: values.modelId,
      vendorId: values.vendorId,
      siteId: values.siteId,
      buildingId: values.buildingId,
      floorId: values.floorId,
      roomId: values.roomId,
      rackId: values.rackId,
      shelfId: values.shelfId,
      binId: values.binId,
      custodianUserId: values.custodianUserId,
      assetTag: values.assetTag,
      serialNumber: values.serialNumber,
      name: values.name,
      status: values.status ?? "in_stock",
      condition: values.condition ?? "good",
      customFields: values.customFields ?? {},
    })
    .returning();

  if (!asset) {
    throw new Error("Failed to create asset.");
  }

  return asset;
}

export async function findAssetByTag(
  tenantId: string,
  assetTag: string,
): Promise<Asset | undefined> {
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.tenantId, tenantId), eq(assets.assetTag, assetTag)))
    .limit(1);

  return asset;
}

export async function findAssetById(tenantId: string, id: string): Promise<Asset | undefined> {
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)))
    .limit(1);

  return asset;
}

export async function listAssetsByTenant(tenantId: string, search?: string): Promise<Asset[]> {
  const whereClause = assetListWhereClause(tenantId, search);

  return getDb().select().from(assets).where(whereClause).orderBy(asc(assets.assetTag));
}

export async function listAssetsPageByTenant(
  tenantId: string,
  options: ListAssetsOptions = {},
): Promise<AssetListPage> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const whereClause = assetListWhereClause(tenantId, options.search);
  const [totalRow, assetRows] = await Promise.all([
    getDb().select({ value: count() }).from(assets).where(whereClause),
    getDb()
      .select()
      .from(assets)
      .where(whereClause)
      .orderBy(asc(assets.assetTag))
      .limit(limit)
      .offset(offset),
  ]);

  return {
    assets: assetRows,
    total: totalRow[0]?.value ?? 0,
    limit,
    offset,
  };
}

function assetListWhereClause(tenantId: string, search?: string) {
  const trimmedSearch = search?.trim();

  return trimmedSearch
    ? and(
        eq(assets.tenantId, tenantId),
        or(
          ilike(assets.assetTag, `%${trimmedSearch}%`),
          ilike(assets.name, `%${trimmedSearch}%`),
          ilike(assets.serialNumber, `%${trimmedSearch}%`),
        ),
      )
    : eq(assets.tenantId, tenantId);
}

export async function updateAsset(
  tenantId: string,
  id: string,
  values: Partial<
    Pick<
      NewAsset,
      | "assetTypeId"
      | "modelId"
      | "vendorId"
      | "siteId"
      | "buildingId"
      | "floorId"
      | "roomId"
      | "rackId"
      | "shelfId"
      | "binId"
      | "custodianUserId"
      | "serialNumber"
      | "name"
      | "status"
      | "condition"
      | "customFields"
    >
  >,
): Promise<Asset | undefined> {
  const [asset] = await getDb()
    .update(assets)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)))
    .returning();

  return asset;
}

export async function createAssetIdentifier(
  values: Pick<NewAssetIdentifier, "tenantId" | "assetId" | "identifierType" | "identifierValue">,
): Promise<AssetIdentifier> {
  const [identifier] = await getDb().insert(assetIdentifiers).values(values).returning();

  if (!identifier) {
    throw new Error("Failed to create asset identifier.");
  }

  return identifier;
}

export async function listAssetIdentifiers(
  tenantId: string,
  assetId: string,
): Promise<AssetIdentifier[]> {
  return getDb()
    .select()
    .from(assetIdentifiers)
    .where(and(eq(assetIdentifiers.tenantId, tenantId), eq(assetIdentifiers.assetId, assetId)))
    .orderBy(asc(assetIdentifiers.identifierType), asc(assetIdentifiers.identifierValue));
}

export async function createAssetAttachment(
  values: Pick<
    NewAssetAttachment,
    | "id"
    | "tenantId"
    | "assetId"
    | "objectKey"
    | "filename"
    | "contentType"
    | "checksumSha256"
    | "contentLength"
  > &
    Partial<Pick<NewAssetAttachment, "uploadedByUserId" | "status">>,
): Promise<AssetAttachment> {
  const [attachment] = await getDb()
    .insert(assetAttachments)
    .values({
      id: values.id,
      tenantId: values.tenantId,
      assetId: values.assetId,
      objectKey: values.objectKey,
      filename: values.filename,
      contentType: values.contentType,
      contentLength: values.contentLength,
      checksumSha256: values.checksumSha256,
      uploadedByUserId: values.uploadedByUserId,
      status: values.status ?? "active",
    })
    .returning();

  if (!attachment) {
    throw new Error("Failed to create asset attachment.");
  }

  return attachment;
}

export async function listAssetAttachments(
  tenantId: string,
  assetId: string,
): Promise<AssetAttachment[]> {
  return getDb()
    .select()
    .from(assetAttachments)
    .where(
      and(
        eq(assetAttachments.tenantId, tenantId),
        eq(assetAttachments.assetId, assetId),
        eq(assetAttachments.status, "active"),
      ),
    )
    .orderBy(desc(assetAttachments.createdAt));
}

export async function findAssetAttachmentById(
  tenantId: string,
  assetId: string,
  attachmentId: string,
): Promise<AssetAttachment | undefined> {
  const [attachment] = await getDb()
    .select()
    .from(assetAttachments)
    .where(
      and(
        eq(assetAttachments.tenantId, tenantId),
        eq(assetAttachments.assetId, assetId),
        eq(assetAttachments.id, attachmentId),
      ),
    )
    .limit(1);

  return attachment;
}

export async function markAssetAttachmentDeleted(
  tenantId: string,
  assetId: string,
  attachmentId: string,
): Promise<AssetAttachment | undefined> {
  const [attachment] = await getDb()
    .update(assetAttachments)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(
      and(
        eq(assetAttachments.tenantId, tenantId),
        eq(assetAttachments.assetId, assetId),
        eq(assetAttachments.id, attachmentId),
      ),
    )
    .returning();

  return attachment;
}

export async function appendAssetLifecycleEvent(
  values: Pick<NewAssetLifecycleEvent, "tenantId" | "assetId" | "eventType"> &
    Partial<Pick<NewAssetLifecycleEvent, "actorUserId" | "fromStatus" | "toStatus" | "metadata">>,
): Promise<AssetLifecycleEvent> {
  const [event] = await getDb()
    .insert(assetLifecycleEvents)
    .values({
      tenantId: values.tenantId,
      assetId: values.assetId,
      actorUserId: values.actorUserId,
      eventType: values.eventType,
      fromStatus: values.fromStatus,
      toStatus: values.toStatus,
      metadata: values.metadata ?? {},
    })
    .returning();

  if (!event) {
    throw new Error("Failed to append asset lifecycle event.");
  }

  return event;
}

export async function listAssetLifecycleEvents(
  tenantId: string,
  assetId: string,
): Promise<AssetLifecycleEvent[]> {
  return getDb()
    .select()
    .from(assetLifecycleEvents)
    .where(
      and(eq(assetLifecycleEvents.tenantId, tenantId), eq(assetLifecycleEvents.assetId, assetId)),
    )
    .orderBy(desc(assetLifecycleEvents.createdAt));
}
