import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  assetLifecycleEvents,
  assetMaintenanceEvents,
  assetMaintenanceTickets,
  assets,
  assetWarranties,
  type Asset,
  type AssetMaintenanceEvent,
  type AssetMaintenanceTicket,
  type AssetWarranty,
  type NewAssetMaintenanceTicket,
  type NewAssetWarranty,
} from "../schema";

export interface MaintenanceTicketMutationResult {
  asset: Asset;
  ticket: AssetMaintenanceTicket;
  event: AssetMaintenanceEvent;
}

export async function listMaintenanceTicketsByTenant(
  tenantId: string,
): Promise<AssetMaintenanceTicket[]> {
  return getDb()
    .select()
    .from(assetMaintenanceTickets)
    .where(eq(assetMaintenanceTickets.tenantId, tenantId))
    .orderBy(desc(assetMaintenanceTickets.createdAt));
}

export async function openMaintenanceTicket(
  values: Pick<
    NewAssetMaintenanceTicket,
    "tenantId" | "assetId" | "openedByUserId" | "issueSummary"
  > &
    Partial<Pick<NewAssetMaintenanceTicket, "assignedToUserId" | "priority">>,
): Promise<MaintenanceTicketMutationResult> {
  return getDb().transaction(async (tx) => {
    const [existingAsset] = await tx
      .select()
      .from(assets)
      .where(and(eq(assets.tenantId, values.tenantId), eq(assets.id, values.assetId)))
      .limit(1);

    if (!existingAsset) {
      throw new Error("Asset was not found.");
    }

    const [ticket] = await tx
      .insert(assetMaintenanceTickets)
      .values({
        tenantId: values.tenantId,
        assetId: values.assetId,
        openedByUserId: values.openedByUserId,
        assignedToUserId: values.assignedToUserId,
        priority: values.priority ?? "medium",
        issueSummary: values.issueSummary,
        status: "open",
      })
      .returning();

    if (!ticket) {
      throw new Error("Failed to open maintenance ticket.");
    }

    const [asset] = await tx
      .update(assets)
      .set({ status: "maintenance", condition: "repair_needed", updatedAt: new Date() })
      .where(and(eq(assets.tenantId, values.tenantId), eq(assets.id, values.assetId)))
      .returning();

    if (!asset) {
      throw new Error("Failed to update asset maintenance state.");
    }

    const [event] = await tx
      .insert(assetMaintenanceEvents)
      .values({
        tenantId: values.tenantId,
        ticketId: ticket.id,
        actorUserId: values.openedByUserId,
        eventType: "maintenance.opened",
        note: values.issueSummary,
      })
      .returning();

    if (!event) {
      throw new Error("Failed to create maintenance event.");
    }

    await tx.insert(assetLifecycleEvents).values({
      tenantId: values.tenantId,
      assetId: values.assetId,
      actorUserId: values.openedByUserId,
      eventType: "asset.maintenance_opened",
      fromStatus: existingAsset.status,
      toStatus: asset.status,
      metadata: { maintenanceTicketId: ticket.id },
    });

    return { asset, ticket, event };
  });
}

export async function updateMaintenanceTicketStatus(
  tenantId: string,
  ticketId: string,
  status: "in_progress" | "resolved" | "cancelled",
  actorUserId: string,
  note?: string,
  resolutionSummary?: string,
  downtimeMinutes?: number,
): Promise<MaintenanceTicketMutationResult> {
  return getDb().transaction(async (tx) => {
    const [existingTicket] = await tx
      .select()
      .from(assetMaintenanceTickets)
      .where(
        and(
          eq(assetMaintenanceTickets.tenantId, tenantId),
          eq(assetMaintenanceTickets.id, ticketId),
        ),
      )
      .limit(1);

    if (!existingTicket) {
      throw new Error("Maintenance ticket was not found.");
    }

    const resolvedAt = status === "resolved" || status === "cancelled" ? new Date() : null;
    const [ticket] = await tx
      .update(assetMaintenanceTickets)
      .set({
        status,
        resolutionSummary: resolutionSummary ?? existingTicket.resolutionSummary,
        resolvedAt,
        downtimeMinutes: downtimeMinutes ?? existingTicket.downtimeMinutes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assetMaintenanceTickets.tenantId, tenantId),
          eq(assetMaintenanceTickets.id, ticketId),
        ),
      )
      .returning();

    if (!ticket) {
      throw new Error("Failed to update maintenance ticket.");
    }

    const targetAssetStatus =
      status === "resolved" || status === "cancelled" ? "in_stock" : "maintenance";
    const targetCondition = status === "resolved" ? "good" : "repair_needed";
    const [asset] = await tx
      .update(assets)
      .set({
        status: targetAssetStatus,
        condition: targetCondition,
        updatedAt: new Date(),
      })
      .where(and(eq(assets.tenantId, tenantId), eq(assets.id, existingTicket.assetId)))
      .returning();

    if (!asset) {
      throw new Error("Failed to update asset maintenance status.");
    }

    const [event] = await tx
      .insert(assetMaintenanceEvents)
      .values({
        tenantId,
        ticketId,
        actorUserId,
        eventType: `maintenance.${status}`,
        note,
      })
      .returning();

    if (!event) {
      throw new Error("Failed to append maintenance event.");
    }

    await tx.insert(assetLifecycleEvents).values({
      tenantId,
      assetId: existingTicket.assetId,
      actorUserId,
      eventType: `asset.maintenance_${status}`,
      fromStatus: "maintenance",
      toStatus: asset.status,
      metadata: { maintenanceTicketId: ticket.id },
    });

    return { asset, ticket, event };
  });
}

export async function listMaintenanceEventsForTicket(
  tenantId: string,
  ticketId: string,
): Promise<AssetMaintenanceEvent[]> {
  return getDb()
    .select()
    .from(assetMaintenanceEvents)
    .where(
      and(
        eq(assetMaintenanceEvents.tenantId, tenantId),
        eq(assetMaintenanceEvents.ticketId, ticketId),
      ),
    )
    .orderBy(desc(assetMaintenanceEvents.createdAt));
}

export async function listWarrantiesByTenant(tenantId: string): Promise<AssetWarranty[]> {
  return getDb()
    .select()
    .from(assetWarranties)
    .where(eq(assetWarranties.tenantId, tenantId))
    .orderBy(desc(assetWarranties.endsAt));
}

export async function createWarranty(
  values: Pick<NewAssetWarranty, "tenantId" | "assetId" | "provider" | "startsAt" | "endsAt"> &
    Partial<Pick<NewAssetWarranty, "contractNumber" | "notes" | "status">>,
): Promise<AssetWarranty> {
  const [warranty] = await getDb()
    .insert(assetWarranties)
    .values({
      tenantId: values.tenantId,
      assetId: values.assetId,
      provider: values.provider,
      contractNumber: values.contractNumber,
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      notes: values.notes,
      status: values.status ?? "active",
    })
    .returning();

  if (!warranty) {
    throw new Error("Failed to create warranty.");
  }

  return warranty;
}
