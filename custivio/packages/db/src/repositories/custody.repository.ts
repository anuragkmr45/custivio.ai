import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  assetCustodyAssignments,
  assets,
  assetLifecycleEvents,
  assetTransferRequests,
  type Asset,
  type AssetCustodyAssignment,
  type AssetTransferRequest,
  type NewAssetCustodyAssignment,
  type NewAssetTransferRequest,
} from "../schema";

export interface CustodyMutationResult {
  asset: Asset;
  assignment: AssetCustodyAssignment;
}

export interface HandoverMutationResult {
  asset: Asset;
  previousAssignment: AssetCustodyAssignment;
  assignment: AssetCustodyAssignment;
}

export async function listCustodyAssignmentsByTenant(
  tenantId: string,
): Promise<AssetCustodyAssignment[]> {
  return getDb()
    .select()
    .from(assetCustodyAssignments)
    .where(eq(assetCustodyAssignments.tenantId, tenantId))
    .orderBy(desc(assetCustodyAssignments.createdAt));
}

export async function findActiveCustodyAssignment(
  tenantId: string,
  assetId: string,
): Promise<AssetCustodyAssignment | undefined> {
  const [assignment] = await getDb()
    .select()
    .from(assetCustodyAssignments)
    .where(
      and(
        eq(assetCustodyAssignments.tenantId, tenantId),
        eq(assetCustodyAssignments.assetId, assetId),
        eq(assetCustodyAssignments.status, "active"),
      ),
    )
    .orderBy(desc(assetCustodyAssignments.checkedOutAt))
    .limit(1);

  return assignment;
}

export async function checkoutAssetToCustodian(
  values: Pick<
    NewAssetCustodyAssignment,
    "tenantId" | "assetId" | "assignedToUserId" | "assignedByUserId"
  > &
    Partial<Pick<NewAssetCustodyAssignment, "dueAt" | "notes">>,
): Promise<CustodyMutationResult> {
  return getDb().transaction(async (tx) => {
    const [existingAsset] = await tx
      .select()
      .from(assets)
      .where(and(eq(assets.tenantId, values.tenantId), eq(assets.id, values.assetId)))
      .limit(1);

    if (!existingAsset) {
      throw new Error("Asset was not found.");
    }

    const [assignment] = await tx
      .insert(assetCustodyAssignments)
      .values({
        tenantId: values.tenantId,
        assetId: values.assetId,
        assignedToUserId: values.assignedToUserId,
        assignedByUserId: values.assignedByUserId,
        dueAt: values.dueAt,
        notes: values.notes,
        status: "active",
      })
      .returning();

    if (!assignment) {
      throw new Error("Failed to create custody assignment.");
    }

    const [asset] = await tx
      .update(assets)
      .set({
        custodianUserId: values.assignedToUserId,
        status: "in_use",
        updatedAt: new Date(),
      })
      .where(and(eq(assets.tenantId, values.tenantId), eq(assets.id, values.assetId)))
      .returning();

    if (!asset) {
      throw new Error("Failed to update asset custody.");
    }

    await tx.insert(assetLifecycleEvents).values({
      tenantId: values.tenantId,
      assetId: values.assetId,
      actorUserId: values.assignedByUserId,
      eventType: "asset.checked_out",
      fromStatus: existingAsset.status,
      toStatus: asset.status,
      metadata: {
        custodyAssignmentId: assignment.id,
        assignedToUserId: values.assignedToUserId,
      },
    });

    return { asset, assignment };
  });
}

export async function checkInCustodyAssignment(
  tenantId: string,
  assignmentId: string,
  actorUserId: string,
  notes?: string,
): Promise<CustodyMutationResult> {
  return getDb().transaction(async (tx) => {
    const [existingAssignment] = await tx
      .select()
      .from(assetCustodyAssignments)
      .where(
        and(
          eq(assetCustodyAssignments.tenantId, tenantId),
          eq(assetCustodyAssignments.id, assignmentId),
          eq(assetCustodyAssignments.status, "active"),
        ),
      )
      .limit(1);

    if (!existingAssignment) {
      throw new Error("Active custody assignment was not found.");
    }

    const now = new Date();
    const [assignment] = await tx
      .update(assetCustodyAssignments)
      .set({
        checkedInAt: now,
        status: "checked_in",
        notes: notes ?? existingAssignment.notes,
        updatedAt: now,
      })
      .where(
        and(
          eq(assetCustodyAssignments.tenantId, tenantId),
          eq(assetCustodyAssignments.id, assignmentId),
        ),
      )
      .returning();

    if (!assignment) {
      throw new Error("Failed to check in custody assignment.");
    }

    const [asset] = await tx
      .update(assets)
      .set({ custodianUserId: null, status: "in_stock", updatedAt: now })
      .where(and(eq(assets.tenantId, tenantId), eq(assets.id, existingAssignment.assetId)))
      .returning();

    if (!asset) {
      throw new Error("Failed to update asset check-in.");
    }

    await tx.insert(assetLifecycleEvents).values({
      tenantId,
      assetId: existingAssignment.assetId,
      actorUserId,
      eventType: "asset.checked_in",
      fromStatus: "in_use",
      toStatus: asset.status,
      metadata: { custodyAssignmentId: assignment.id },
    });

    return { asset, assignment };
  });
}

export async function handoverCustodyAssignment(
  tenantId: string,
  assignmentId: string,
  toUserId: string,
  actorUserId: string,
  notes?: string,
): Promise<HandoverMutationResult> {
  return getDb().transaction(async (tx) => {
    const [existingAssignment] = await tx
      .select()
      .from(assetCustodyAssignments)
      .where(
        and(
          eq(assetCustodyAssignments.tenantId, tenantId),
          eq(assetCustodyAssignments.id, assignmentId),
          eq(assetCustodyAssignments.status, "active"),
        ),
      )
      .limit(1);

    if (!existingAssignment) {
      throw new Error("Active custody assignment was not found.");
    }

    const now = new Date();
    const [previousAssignment] = await tx
      .update(assetCustodyAssignments)
      .set({
        checkedInAt: now,
        status: "handed_over",
        notes: notes ?? existingAssignment.notes,
        updatedAt: now,
      })
      .where(
        and(
          eq(assetCustodyAssignments.tenantId, tenantId),
          eq(assetCustodyAssignments.id, assignmentId),
        ),
      )
      .returning();

    if (!previousAssignment) {
      throw new Error("Failed to close previous custody assignment.");
    }

    const [assignment] = await tx
      .insert(assetCustodyAssignments)
      .values({
        tenantId,
        assetId: existingAssignment.assetId,
        assignedToUserId: toUserId,
        assignedByUserId: actorUserId,
        notes,
        status: "active",
      })
      .returning();

    if (!assignment) {
      throw new Error("Failed to create handover custody assignment.");
    }

    const [asset] = await tx
      .update(assets)
      .set({ custodianUserId: toUserId, status: "in_use", updatedAt: now })
      .where(and(eq(assets.tenantId, tenantId), eq(assets.id, existingAssignment.assetId)))
      .returning();

    if (!asset) {
      throw new Error("Failed to update asset handover.");
    }

    await tx.insert(assetLifecycleEvents).values({
      tenantId,
      assetId: existingAssignment.assetId,
      actorUserId,
      eventType: "asset.handed_over",
      fromStatus: "in_use",
      toStatus: asset.status,
      metadata: {
        previousAssignmentId: previousAssignment.id,
        custodyAssignmentId: assignment.id,
        fromUserId: existingAssignment.assignedToUserId,
        toUserId,
      },
    });

    return { asset, previousAssignment, assignment };
  });
}

export async function listTransferRequestsByTenant(
  tenantId: string,
): Promise<AssetTransferRequest[]> {
  return getDb()
    .select()
    .from(assetTransferRequests)
    .where(eq(assetTransferRequests.tenantId, tenantId))
    .orderBy(desc(assetTransferRequests.createdAt));
}

export async function createTransferRequest(
  values: Pick<
    NewAssetTransferRequest,
    "tenantId" | "assetId" | "toCustodianUserId" | "requestedByUserId"
  > &
    Partial<Pick<NewAssetTransferRequest, "fromCustodianUserId" | "reason">>,
): Promise<AssetTransferRequest> {
  const [request] = await getDb()
    .insert(assetTransferRequests)
    .values({
      tenantId: values.tenantId,
      assetId: values.assetId,
      fromCustodianUserId: values.fromCustodianUserId,
      toCustodianUserId: values.toCustodianUserId,
      requestedByUserId: values.requestedByUserId,
      reason: values.reason,
      status: "pending",
    })
    .returning();

  if (!request) {
    throw new Error("Failed to create transfer request.");
  }

  return request;
}

export async function decideTransferRequest(
  tenantId: string,
  transferRequestId: string,
  decision: "approved" | "rejected",
  decidedByUserId: string,
  decisionNote?: string,
): Promise<AssetTransferRequest> {
  return getDb().transaction(async (tx) => {
    const [existingRequest] = await tx
      .select()
      .from(assetTransferRequests)
      .where(
        and(
          eq(assetTransferRequests.tenantId, tenantId),
          eq(assetTransferRequests.id, transferRequestId),
          eq(assetTransferRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (!existingRequest) {
      throw new Error("Pending transfer request was not found.");
    }

    const now = new Date();
    const [request] = await tx
      .update(assetTransferRequests)
      .set({
        status: decision,
        decidedByUserId,
        decisionNote,
        decidedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(assetTransferRequests.tenantId, tenantId),
          eq(assetTransferRequests.id, transferRequestId),
        ),
      )
      .returning();

    if (!request) {
      throw new Error("Failed to decide transfer request.");
    }

    if (decision === "approved") {
      const [asset] = await tx
        .update(assets)
        .set({
          custodianUserId: existingRequest.toCustodianUserId,
          status: "in_use",
          updatedAt: now,
        })
        .where(and(eq(assets.tenantId, tenantId), eq(assets.id, existingRequest.assetId)))
        .returning();

      if (!asset) {
        throw new Error("Failed to apply approved transfer.");
      }

      await tx.insert(assetLifecycleEvents).values({
        tenantId,
        assetId: existingRequest.assetId,
        actorUserId: decidedByUserId,
        eventType: "asset.transfer_approved",
        fromStatus: "in_use",
        toStatus: asset.status,
        metadata: {
          transferRequestId: request.id,
          toCustodianUserId: existingRequest.toCustodianUserId,
        },
      });
    } else {
      await tx.insert(assetLifecycleEvents).values({
        tenantId,
        assetId: existingRequest.assetId,
        actorUserId: decidedByUserId,
        eventType: "asset.transfer_rejected",
        metadata: { transferRequestId: request.id },
      });
    }

    return request;
  });
}
