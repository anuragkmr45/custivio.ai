import { requirePermission } from "@custivio/auth";
import {
  appendAuditLog,
  checkInCustodyAssignment,
  checkoutAssetToCustodian,
  createTransferRequest,
  createWarranty,
  decideTransferRequest,
  findActiveCustodyAssignment,
  findAssetById,
  findUserById,
  handoverCustodyAssignment,
  listAssetsByTenant,
  listCustodyAssignmentsByTenant,
  listMaintenanceTicketsByTenant,
  listTransferRequestsByTenant,
  listUsersByTenant,
  listWarrantiesByTenant,
  openMaintenanceTicket,
  updateMaintenanceTicketStatus,
  type Asset,
  type AssetCustodyAssignment,
  type AssetMaintenanceTicket,
  type AssetTransferRequest,
  type AssetWarranty,
  type User,
} from "@custivio/db";

import { OperationsError } from "./errors";

export interface CustodyOverview {
  assets: Asset[];
  users: User[];
  assignments: AssetCustodyAssignment[];
  transfers: AssetTransferRequest[];
}

export interface MaintenanceOverview {
  assets: Asset[];
  users: User[];
  tickets: AssetMaintenanceTicket[];
  warranties: AssetWarranty[];
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
    throw new OperationsError("invalid_operations_input", `${key} is required.`, 400);
  }

  return value;
}

function readInteger(input: Record<string, unknown>, key: string, defaultValue = 0): number {
  const value = input[key];

  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

function readDate(input: Record<string, unknown>, key: string): Date {
  const value = requireString(input, key);
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new OperationsError("invalid_operations_input", `${key} must be a valid date.`, 400);
  }

  return date;
}

function readOptionalDate(input: Record<string, unknown>, key: string): Date | undefined {
  const value = readOptionalString(input, key);

  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new OperationsError("invalid_operations_input", `${key} must be a valid date.`, 400);
  }

  return date;
}

function requireTransferDecision(value: string): "approved" | "rejected" {
  if (value === "approved" || value === "rejected") {
    return value;
  }

  throw new OperationsError("invalid_transfer_decision", "decision is invalid.", 400);
}

function requireMaintenanceStatus(value: string): "in_progress" | "resolved" | "cancelled" {
  if (value === "in_progress" || value === "resolved" || value === "cancelled") {
    return value;
  }

  throw new OperationsError("invalid_maintenance_status", "status is invalid.", 400);
}

async function requireAsset(tenantId: string, assetId: string): Promise<Asset> {
  const asset = await findAssetById(tenantId, assetId);

  if (!asset) {
    throw new OperationsError("asset_not_found", "Asset was not found.", 404);
  }

  return asset;
}

async function requireUser(tenantId: string, userId: string): Promise<User> {
  const user = await findUserById(tenantId, userId);

  if (!user) {
    throw new OperationsError("user_not_found", "User was not found.", 404);
  }

  return user;
}

async function writeOperationsAudit(
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

export async function listCustodyOverview(
  sessionToken: string | undefined,
): Promise<CustodyOverview> {
  const session = await requirePermission(sessionToken, "custody.read");
  const [assets, users, assignments, transfers] = await Promise.all([
    listAssetsByTenant(session.tenant.id),
    listUsersByTenant(session.tenant.id),
    listCustodyAssignmentsByTenant(session.tenant.id),
    listTransferRequestsByTenant(session.tenant.id),
  ]);

  return { assets, users, assignments, transfers };
}

export async function checkoutAssetForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetCustodyAssignment> {
  const session = await requirePermission(sessionToken, "custody.write");
  const assetId = requireString(input, "assetId");
  const assignedToUserId = requireString(input, "assignedToUserId");

  await requireAsset(session.tenant.id, assetId);
  await requireUser(session.tenant.id, assignedToUserId);

  const activeAssignment = await findActiveCustodyAssignment(session.tenant.id, assetId);

  if (activeAssignment) {
    throw new OperationsError(
      "asset_already_checked_out",
      "Asset already has an active custody assignment.",
      409,
    );
  }

  const result = await checkoutAssetToCustodian({
    tenantId: session.tenant.id,
    assetId,
    assignedToUserId,
    assignedByUserId: session.user.id,
    dueAt: readOptionalDate(input, "dueAt"),
    notes: readOptionalString(input, "notes"),
  });

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    "custody.checked_out",
    "custody",
    result.assignment.id,
    requestId,
  );

  return result.assignment;
}

export async function checkInAssetForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetCustodyAssignment> {
  const session = await requirePermission(sessionToken, "custody.write");
  const result = await checkInCustodyAssignment(
    session.tenant.id,
    requireString(input, "assignmentId"),
    session.user.id,
    readOptionalString(input, "notes"),
  );

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    "custody.checked_in",
    "custody",
    result.assignment.id,
    requestId,
  );

  return result.assignment;
}

export async function handoverAssetForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetCustodyAssignment> {
  const session = await requirePermission(sessionToken, "custody.write");
  const toUserId = requireString(input, "toUserId");

  await requireUser(session.tenant.id, toUserId);

  const result = await handoverCustodyAssignment(
    session.tenant.id,
    requireString(input, "assignmentId"),
    toUserId,
    session.user.id,
    readOptionalString(input, "notes"),
  );

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    "custody.handed_over",
    "custody",
    result.assignment.id,
    requestId,
  );

  return result.assignment;
}

export async function createTransferRequestForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetTransferRequest> {
  const session = await requirePermission(sessionToken, "custody.write");
  const asset = await requireAsset(session.tenant.id, requireString(input, "assetId"));
  const toCustodianUserId = requireString(input, "toCustodianUserId");

  await requireUser(session.tenant.id, toCustodianUserId);

  const request = await createTransferRequest({
    tenantId: session.tenant.id,
    assetId: asset.id,
    fromCustodianUserId: asset.custodianUserId,
    toCustodianUserId,
    requestedByUserId: session.user.id,
    reason: readOptionalString(input, "reason"),
  });

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    "transfer.requested",
    "asset_transfer",
    request.id,
    requestId,
  );

  return request;
}

export async function decideTransferRequestForSession(
  sessionToken: string | undefined,
  transferRequestId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetTransferRequest> {
  const session = await requirePermission(sessionToken, "custody.write");
  const decision = requireTransferDecision(requireString(input, "decision"));
  const request = await decideTransferRequest(
    session.tenant.id,
    transferRequestId,
    decision,
    session.user.id,
    readOptionalString(input, "decisionNote"),
  );

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    `transfer.${decision}`,
    "asset_transfer",
    request.id,
    requestId,
  );

  return request;
}

export async function listMaintenanceOverview(
  sessionToken: string | undefined,
): Promise<MaintenanceOverview> {
  const session = await requirePermission(sessionToken, "maintenance.read");
  const [assets, users, tickets, warranties] = await Promise.all([
    listAssetsByTenant(session.tenant.id),
    listUsersByTenant(session.tenant.id),
    listMaintenanceTicketsByTenant(session.tenant.id),
    listWarrantiesByTenant(session.tenant.id),
  ]);

  return { assets, users, tickets, warranties };
}

export async function openMaintenanceTicketForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetMaintenanceTicket> {
  const session = await requirePermission(sessionToken, "maintenance.write");
  const assetId = requireString(input, "assetId");
  const assignedToUserId = readOptionalString(input, "assignedToUserId");

  await requireAsset(session.tenant.id, assetId);

  if (assignedToUserId) {
    await requireUser(session.tenant.id, assignedToUserId);
  }

  const result = await openMaintenanceTicket({
    tenantId: session.tenant.id,
    assetId,
    openedByUserId: session.user.id,
    assignedToUserId,
    issueSummary: requireString(input, "issueSummary"),
    priority: readOptionalString(input, "priority"),
  });

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    "maintenance.opened",
    "maintenance_ticket",
    result.ticket.id,
    requestId,
  );

  return result.ticket;
}

export async function updateMaintenanceTicketStatusForSession(
  sessionToken: string | undefined,
  ticketId: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetMaintenanceTicket> {
  const session = await requirePermission(sessionToken, "maintenance.write");
  const status = requireMaintenanceStatus(requireString(input, "status"));
  const result = await updateMaintenanceTicketStatus(
    session.tenant.id,
    ticketId,
    status,
    session.user.id,
    readOptionalString(input, "note"),
    readOptionalString(input, "resolutionSummary"),
    readInteger(input, "downtimeMinutes", 0),
  );

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    `maintenance.${status}`,
    "maintenance_ticket",
    result.ticket.id,
    requestId,
  );

  return result.ticket;
}

export async function createWarrantyForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AssetWarranty> {
  const session = await requirePermission(sessionToken, "maintenance.write");
  const assetId = requireString(input, "assetId");

  await requireAsset(session.tenant.id, assetId);

  const warranty = await createWarranty({
    tenantId: session.tenant.id,
    assetId,
    provider: requireString(input, "provider"),
    contractNumber: readOptionalString(input, "contractNumber"),
    startsAt: readDate(input, "startsAt"),
    endsAt: readDate(input, "endsAt"),
    notes: readOptionalString(input, "notes"),
    status: readOptionalString(input, "status"),
  });

  await writeOperationsAudit(
    session.tenant.id,
    session.user.id,
    "warranty.created",
    "asset_warranty",
    warranty.id,
    requestId,
  );

  return warranty;
}
