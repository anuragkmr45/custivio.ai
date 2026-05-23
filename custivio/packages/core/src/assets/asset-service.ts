import { randomUUID } from "node:crypto";

import { requirePermission } from "@custivio/auth";
import {
  appendAssetLifecycleEvent,
  appendAuditLog,
  createAsset,
  createAssetAttachment,
  createAssetIdentifier,
  findAssetById,
  findAssetAttachmentById,
  listAssetAttachments,
  listAssetIdentifiers,
  listAssetLifecycleEvents,
  listAssetsPageByTenant,
  markAssetAttachmentDeleted,
  updateAsset,
  type Asset,
  type AssetAttachment,
  type AssetIdentifier,
  type AssetLifecycleEvent,
} from "@custivio/db";
import {
  assertAllowedContentType,
  calculateSha256Hex,
  createAssetAttachmentObjectKey,
  createContentDisposition,
  deleteObject,
  getObject,
  maxUploadBytes,
  putObject,
  type StoredObject,
} from "@custivio/storage";
import { recordAssetMutation, recordFileOperation } from "@custivio/telemetry";

import { AssetError } from "./errors";

const defaultAssetListLimit = 50;
const maxAssetListLimit = 100;

export interface AssetDetail {
  asset: Asset;
  identifiers: AssetIdentifier[];
  attachments: AssetAttachment[];
  lifecycleEvents: AssetLifecycleEvent[];
  qrPayload: string;
}

export interface AttachmentInput {
  filename: string;
  contentType: string;
  body: Uint8Array;
}

export interface AssetAttachmentDownload {
  attachment: AssetAttachment;
  contentDisposition: string;
  object: StoredObject;
}

export interface AssetListInput {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AssetListResult {
  assets: Asset[];
  pageInfo: {
    total: number;
    limit: number;
    offset: number;
    hasNextPage: boolean;
  };
}

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
    throw new AssetError("invalid_asset_input", `${key} is required.`, 400);
  }

  return value;
}

function readJsonObject(input: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = input[key];

  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return {};
    }

    const parsed = JSON.parse(trimmed) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new AssetError("invalid_asset_input", `${key} must be an object.`, 400);
}

function createQrPayload(tenantId: string, asset: Asset): string {
  return JSON.stringify({
    type: "custivio.asset",
    version: 1,
    tenantId,
    assetId: asset.id,
    assetTag: asset.assetTag,
  });
}

async function requireAsset(tenantId: string, assetId: string): Promise<Asset> {
  const asset = await findAssetById(tenantId, assetId);

  if (!asset) {
    throw new AssetError("asset_not_found", "Asset was not found.", 404);
  }

  return asset;
}

async function writeAssetAudit(
  tenantId: string,
  actorUserId: string,
  action: string,
  assetId: string,
  requestId?: string,
): Promise<void> {
  await appendAuditLog({
    tenantId,
    actorUserId,
    action,
    entityType: "asset",
    entityId: assetId,
    requestId,
  });
}

export async function listAssetsForSession(
  sessionToken: string | undefined,
  input: AssetListInput = {},
): Promise<AssetListResult> {
  const session = await requirePermission(sessionToken, "assets.read");
  const limit = clampAssetListLimit(input.limit);
  const offset = Math.max(0, Math.trunc(input.offset ?? 0));
  const result = await listAssetsPageByTenant(session.tenant.id, {
    ...(input.search ? { search: input.search } : {}),
    limit,
    offset,
  });

  return {
    assets: result.assets,
    pageInfo: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasNextPage: result.offset + result.assets.length < result.total,
    },
  };
}

function clampAssetListLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return defaultAssetListLimit;

  return Math.min(maxAssetListLimit, Math.max(1, Math.trunc(value ?? defaultAssetListLimit)));
}

export async function getAssetDetail(
  sessionToken: string | undefined,
  assetId: string,
): Promise<AssetDetail> {
  const session = await requirePermission(sessionToken, "assets.read");
  const asset = await requireAsset(session.tenant.id, assetId);
  const [identifiers, attachments, lifecycleEvents] = await Promise.all([
    listAssetIdentifiers(session.tenant.id, asset.id),
    listAssetAttachments(session.tenant.id, asset.id),
    listAssetLifecycleEvents(session.tenant.id, asset.id),
  ]);

  return {
    asset,
    identifiers,
    attachments,
    lifecycleEvents,
    qrPayload: createQrPayload(session.tenant.id, asset),
  };
}

export async function createAssetForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<Asset> {
  const session = await requirePermission(sessionToken, "assets.write");
  const asset = await createAsset({
    tenantId: session.tenant.id,
    assetTypeId: requireString(input, "assetTypeId"),
    modelId: readOptionalString(input, "modelId"),
    vendorId: readOptionalString(input, "vendorId"),
    siteId: readOptionalString(input, "siteId"),
    buildingId: readOptionalString(input, "buildingId"),
    floorId: readOptionalString(input, "floorId"),
    roomId: readOptionalString(input, "roomId"),
    rackId: readOptionalString(input, "rackId"),
    shelfId: readOptionalString(input, "shelfId"),
    binId: readOptionalString(input, "binId"),
    custodianUserId: readOptionalString(input, "custodianUserId"),
    assetTag: requireString(input, "assetTag"),
    serialNumber: readOptionalString(input, "serialNumber"),
    name: requireString(input, "name"),
    status: readOptionalString(input, "status"),
    condition: readOptionalString(input, "condition"),
    customFields: readJsonObject(input, "customFields"),
  });

  await appendAssetLifecycleEvent({
    tenantId: session.tenant.id,
    assetId: asset.id,
    actorUserId: session.user.id,
    eventType: "asset.created",
    toStatus: asset.status,
  });
  await writeAssetAudit(session.tenant.id, session.user.id, "asset.created", asset.id, requestId);
  recordAssetMutation("create");

  return asset;
}

export async function updateAssetForSession(
  sessionToken: string | undefined,
  assetId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<Asset> {
  const session = await requirePermission(sessionToken, "assets.write");
  const existing = await requireAsset(session.tenant.id, assetId);
  const patch: Parameters<typeof updateAsset>[2] = {};
  const name = readOptionalString(input, "name");
  const status = readOptionalString(input, "status");
  const condition = readOptionalString(input, "condition");
  const assetTypeId = readOptionalString(input, "assetTypeId");
  const modelId = readOptionalString(input, "modelId");
  const vendorId = readOptionalString(input, "vendorId");
  const siteId = readOptionalString(input, "siteId");
  const buildingId = readOptionalString(input, "buildingId");
  const floorId = readOptionalString(input, "floorId");
  const roomId = readOptionalString(input, "roomId");
  const rackId = readOptionalString(input, "rackId");
  const shelfId = readOptionalString(input, "shelfId");
  const binId = readOptionalString(input, "binId");
  const custodianUserId = readOptionalString(input, "custodianUserId");
  const serialNumber = readOptionalString(input, "serialNumber");
  const customFields = Object.hasOwn(input, "customFields")
    ? readJsonObject(input, "customFields")
    : undefined;

  if (name) patch.name = name;
  if (status) patch.status = status;
  if (condition) patch.condition = condition;
  if (assetTypeId) patch.assetTypeId = assetTypeId;
  if (modelId) patch.modelId = modelId;
  if (vendorId) patch.vendorId = vendorId;
  if (siteId) patch.siteId = siteId;
  if (buildingId) patch.buildingId = buildingId;
  if (floorId) patch.floorId = floorId;
  if (roomId) patch.roomId = roomId;
  if (rackId) patch.rackId = rackId;
  if (shelfId) patch.shelfId = shelfId;
  if (binId) patch.binId = binId;
  if (custodianUserId) patch.custodianUserId = custodianUserId;
  if (serialNumber) patch.serialNumber = serialNumber;
  if (customFields) patch.customFields = customFields;

  const updated = await updateAsset(session.tenant.id, assetId, patch);

  if (!updated) {
    throw new AssetError("asset_not_found", "Asset was not found.", 404);
  }

  if (status && status !== existing.status) {
    await appendAssetLifecycleEvent({
      tenantId: session.tenant.id,
      assetId,
      actorUserId: session.user.id,
      eventType: "asset.status_changed",
      fromStatus: existing.status,
      toStatus: status,
    });
  }

  await writeAssetAudit(session.tenant.id, session.user.id, "asset.updated", assetId, requestId);
  recordAssetMutation("update");

  return updated;
}

export async function addAssetIdentifierForSession(
  sessionToken: string | undefined,
  assetId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetIdentifier> {
  const session = await requirePermission(sessionToken, "assets.write");
  await requireAsset(session.tenant.id, assetId);

  const identifier = await createAssetIdentifier({
    tenantId: session.tenant.id,
    assetId,
    identifierType: requireString(input, "identifierType"),
    identifierValue: requireString(input, "identifierValue"),
  });

  await writeAssetAudit(
    session.tenant.id,
    session.user.id,
    "asset.identifier_added",
    assetId,
    requestId,
  );

  return identifier;
}

export async function appendAssetLifecycleForSession(
  sessionToken: string | undefined,
  assetId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetLifecycleEvent> {
  const session = await requirePermission(sessionToken, "assets.write");
  await requireAsset(session.tenant.id, assetId);

  const event = await appendAssetLifecycleEvent({
    tenantId: session.tenant.id,
    assetId,
    actorUserId: session.user.id,
    eventType: requireString(input, "eventType"),
    metadata: readJsonObject(input, "metadata"),
  });

  await writeAssetAudit(
    session.tenant.id,
    session.user.id,
    "asset.lifecycle_event_added",
    assetId,
    requestId,
  );

  return event;
}

export async function uploadAssetAttachmentForSession(
  sessionToken: string | undefined,
  assetId: string,
  input: AttachmentInput,
  requestId?: string,
): Promise<AssetAttachment> {
  const session = await requirePermission(sessionToken, "assets.write");
  await requireAsset(session.tenant.id, assetId);

  if (input.filename.trim().length === 0 || input.body.byteLength === 0) {
    recordFileOperation("upload", "failure");
    throw new AssetError("invalid_asset_input", "Attachment file is required.", 400);
  }

  if (input.body.byteLength > maxUploadBytes) {
    recordFileOperation("upload", "failure");
    throw new AssetError(
      "invalid_asset_input",
      "Attachment exceeds the maximum allowed size.",
      400,
    );
  }

  try {
    assertAllowedContentType(input.contentType);
  } catch {
    recordFileOperation("upload", "failure");
    throw new AssetError("invalid_asset_input", "Attachment content type is not allowed.", 400);
  }

  const attachmentId = randomUUID();
  const objectKey = createAssetAttachmentObjectKey(
    session.tenant.id,
    assetId,
    attachmentId,
    input.filename,
  );
  const checksumSha256 = calculateSha256Hex(input.body);
  const contentLength = input.body.byteLength;

  await putObject(objectKey, input.body, input.contentType);

  let attachment: AssetAttachment;

  try {
    attachment = await createAssetAttachment({
      id: attachmentId,
      tenantId: session.tenant.id,
      assetId,
      objectKey,
      filename: input.filename,
      contentType: input.contentType,
      contentLength,
      checksumSha256,
      uploadedByUserId: session.user.id,
    });
  } catch (error) {
    await deleteObject(objectKey);
    recordFileOperation("upload", "failure");

    throw error;
  }

  await appendAssetLifecycleEvent({
    tenantId: session.tenant.id,
    assetId,
    actorUserId: session.user.id,
    eventType: "asset.attachment_uploaded",
    metadata: { attachmentId: attachment.id, filename: attachment.filename },
  });
  await writeAssetAudit(
    session.tenant.id,
    session.user.id,
    "asset.attachment_uploaded",
    assetId,
    requestId,
  );
  recordFileOperation("upload", "success");

  return attachment;
}

export async function getAssetAttachmentDownloadForSession(
  sessionToken: string | undefined,
  assetId: string,
  attachmentId: string,
  requestId?: string,
): Promise<AssetAttachmentDownload> {
  const session = await requirePermission(sessionToken, "assets.read");
  await requireAsset(session.tenant.id, assetId);

  const attachment = await findAssetAttachmentById(session.tenant.id, assetId, attachmentId);

  if (attachment?.status !== "active") {
    throw new AssetError("asset_attachment_not_found", "Attachment was not found.", 404);
  }

  let object: StoredObject;

  try {
    object = await getObject(attachment.objectKey);
  } catch {
    recordFileOperation("download", "failure");
    throw new AssetError(
      "asset_attachment_object_not_found",
      "Attachment object was not found.",
      404,
    );
  }

  if (attachment.checksumSha256 && calculateSha256Hex(object.body) !== attachment.checksumSha256) {
    recordFileOperation("download", "failure");
    throw new AssetError(
      "asset_attachment_checksum_mismatch",
      "Attachment checksum did not match stored metadata.",
      409,
    );
  }

  await writeAssetAudit(
    session.tenant.id,
    session.user.id,
    "asset.attachment_downloaded",
    assetId,
    requestId,
  );
  recordFileOperation("download", "success");

  return {
    attachment,
    contentDisposition: createContentDisposition(attachment.filename),
    object,
  };
}

export async function deleteAssetAttachmentForSession(
  sessionToken: string | undefined,
  assetId: string,
  attachmentId: string,
  requestId?: string,
): Promise<AssetAttachment> {
  const session = await requirePermission(sessionToken, "assets.write");
  await requireAsset(session.tenant.id, assetId);

  const existing = await findAssetAttachmentById(session.tenant.id, assetId, attachmentId);

  if (existing?.status !== "active") {
    throw new AssetError("asset_attachment_not_found", "Attachment was not found.", 404);
  }

  const attachment = await markAssetAttachmentDeleted(session.tenant.id, assetId, attachmentId);

  if (!attachment) {
    throw new AssetError("asset_attachment_not_found", "Attachment was not found.", 404);
  }

  try {
    await deleteObject(existing.objectKey);
  } catch {
    // Metadata is soft-deleted first so the object is no longer downloadable if MinIO cleanup fails.
    recordFileOperation("delete", "failure");
  }

  await appendAssetLifecycleEvent({
    tenantId: session.tenant.id,
    assetId,
    actorUserId: session.user.id,
    eventType: "asset.attachment_deleted",
    metadata: { attachmentId },
  });
  await writeAssetAudit(
    session.tenant.id,
    session.user.id,
    "asset.attachment_deleted",
    assetId,
    requestId,
  );
  recordFileOperation("delete", "success");

  return attachment;
}
