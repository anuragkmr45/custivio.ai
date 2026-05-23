import { and, asc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { auditLogs, type AuditLog, type NewAuditLog } from "../schema";

export async function appendAuditLog(
  values: Pick<NewAuditLog, "tenantId" | "action" | "entityType"> &
    Partial<Pick<NewAuditLog, "actorUserId" | "entityId" | "metadata" | "requestId">>,
): Promise<AuditLog> {
  const [auditLog] = await getDb()
    .insert(auditLogs)
    .values({
      tenantId: values.tenantId,
      actorUserId: values.actorUserId,
      action: values.action,
      entityType: values.entityType,
      entityId: values.entityId,
      metadata: values.metadata ?? {},
      requestId: values.requestId,
    })
    .returning();

  if (!auditLog) {
    throw new Error("Failed to append audit log.");
  }

  return auditLog;
}

export async function listAuditLogsForEntity(
  tenantId: string,
  entityType: string,
  entityId: string,
): Promise<AuditLog[]> {
  return getDb()
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId),
      ),
    )
    .orderBy(asc(auditLogs.occurredAt), asc(auditLogs.id));
}
