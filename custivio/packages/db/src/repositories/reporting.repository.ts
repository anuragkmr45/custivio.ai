import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  auditCampaigns,
  auditFindings,
  auditScanResults,
  exportJobs,
  importJobRows,
  importJobs,
  savedFilters,
  type AuditCampaign,
  type AuditFinding,
  type AuditScanResult,
  type ExportJob,
  type ImportJob,
  type ImportJobRow,
  type NewAuditCampaign,
  type NewAuditFinding,
  type NewAuditScanResult,
  type NewExportJob,
  type NewImportJob,
  type NewImportJobRow,
  type NewSavedFilter,
  type SavedFilter,
} from "../schema";

export interface AuditScanMutationResult {
  scan: AuditScanResult;
  finding?: AuditFinding;
}

export async function listAuditCampaignsByTenant(tenantId: string): Promise<AuditCampaign[]> {
  return getDb()
    .select()
    .from(auditCampaigns)
    .where(eq(auditCampaigns.tenantId, tenantId))
    .orderBy(desc(auditCampaigns.createdAt));
}

export async function createAuditCampaign(
  values: Pick<NewAuditCampaign, "tenantId" | "name" | "createdByUserId"> &
    Partial<Pick<NewAuditCampaign, "scope" | "plannedAt" | "status">>,
): Promise<AuditCampaign> {
  const [campaign] = await getDb()
    .insert(auditCampaigns)
    .values({
      tenantId: values.tenantId,
      name: values.name,
      scope: values.scope ?? "all_assets",
      plannedAt: values.plannedAt,
      status: values.status ?? "planned",
      createdByUserId: values.createdByUserId,
    })
    .returning();

  if (!campaign) {
    throw new Error("Failed to create audit campaign.");
  }

  return campaign;
}

export async function findAuditCampaignById(
  tenantId: string,
  campaignId: string,
): Promise<AuditCampaign | undefined> {
  const [campaign] = await getDb()
    .select()
    .from(auditCampaigns)
    .where(and(eq(auditCampaigns.tenantId, tenantId), eq(auditCampaigns.id, campaignId)))
    .limit(1);

  return campaign;
}

export async function listAuditScansByTenant(tenantId: string): Promise<AuditScanResult[]> {
  return getDb()
    .select()
    .from(auditScanResults)
    .where(eq(auditScanResults.tenantId, tenantId))
    .orderBy(desc(auditScanResults.scannedAt));
}

export async function listAuditFindingsByTenant(tenantId: string): Promise<AuditFinding[]> {
  return getDb()
    .select()
    .from(auditFindings)
    .where(eq(auditFindings.tenantId, tenantId))
    .orderBy(desc(auditFindings.createdAt));
}

export async function recordAuditScan(
  values: Pick<
    NewAuditScanResult,
    "tenantId" | "campaignId" | "scanCode" | "resultStatus" | "scannedByUserId"
  > &
    Partial<Pick<NewAuditScanResult, "assetId" | "notes">> & {
      finding?: Pick<NewAuditFinding, "severity" | "description">;
    },
): Promise<AuditScanMutationResult> {
  return getDb().transaction(async (tx) => {
    const [scan] = await tx
      .insert(auditScanResults)
      .values({
        tenantId: values.tenantId,
        campaignId: values.campaignId,
        assetId: values.assetId,
        scanCode: values.scanCode,
        resultStatus: values.resultStatus,
        notes: values.notes,
        scannedByUserId: values.scannedByUserId,
      })
      .returning();

    if (!scan) {
      throw new Error("Failed to record audit scan.");
    }

    if (!values.finding) {
      return { scan };
    }

    const [finding] = await tx
      .insert(auditFindings)
      .values({
        tenantId: values.tenantId,
        campaignId: values.campaignId,
        scanResultId: scan.id,
        assetId: values.assetId,
        severity: values.finding.severity,
        description: values.finding.description,
        status: "open",
      })
      .returning();

    if (!finding) {
      throw new Error("Failed to create audit finding.");
    }

    return { scan, finding };
  });
}

export async function listImportJobsByTenant(tenantId: string): Promise<ImportJob[]> {
  return getDb()
    .select()
    .from(importJobs)
    .where(eq(importJobs.tenantId, tenantId))
    .orderBy(desc(importJobs.createdAt));
}

export async function listImportRowsByJob(
  tenantId: string,
  importJobId: string,
): Promise<ImportJobRow[]> {
  return getDb()
    .select()
    .from(importJobRows)
    .where(and(eq(importJobRows.tenantId, tenantId), eq(importJobRows.importJobId, importJobId)))
    .orderBy(asc(importJobRows.rowNumber));
}

export async function findImportJobByIdempotencyKey(
  tenantId: string,
  idempotencyKey: string,
): Promise<ImportJob | undefined> {
  const [job] = await getDb()
    .select()
    .from(importJobs)
    .where(and(eq(importJobs.tenantId, tenantId), eq(importJobs.idempotencyKey, idempotencyKey)))
    .limit(1);

  return job;
}

export async function findImportJobById(
  tenantId: string,
  importJobId: string,
): Promise<ImportJob | undefined> {
  const [job] = await getDb()
    .select()
    .from(importJobs)
    .where(and(eq(importJobs.tenantId, tenantId), eq(importJobs.id, importJobId)))
    .limit(1);

  return job;
}

function normalizeMetadata(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

export async function updateImportJobWorkerState(input: {
  tenantId: string;
  importJobId: string;
  status: "processing" | "failed" | "dead_letter";
  retryCount: number;
  errorMessage?: string;
  requestId?: string;
}): Promise<ImportJob | undefined> {
  const existing = await findImportJobById(input.tenantId, input.importJobId);

  if (!existing) {
    return undefined;
  }

  const now = new Date();
  const metadata = normalizeMetadata(existing.metadata);

  const [job] = await getDb()
    .update(importJobs)
    .set({
      status: input.status,
      lockedAt: input.status === "processing" ? now : existing.lockedAt,
      completedAt: input.status === "dead_letter" ? now : existing.completedAt,
      updatedAt: now,
      metadata: {
        ...metadata,
        worker: {
          errorMessage: input.errorMessage ?? null,
          requestId: input.requestId ?? null,
          retryCount: input.retryCount,
          status: input.status,
          updatedAt: now.toISOString(),
        },
      },
    })
    .where(and(eq(importJobs.tenantId, input.tenantId), eq(importJobs.id, input.importJobId)))
    .returning();

  return job;
}

export async function createImportJobWithRows(
  values: Pick<NewImportJob, "tenantId" | "importType" | "originalFilename" | "createdByUserId"> &
    Partial<Pick<NewImportJob, "idempotencyKey" | "metadata">> & {
      rows: (Pick<NewImportJobRow, "rowNumber" | "status"> &
        Partial<Pick<NewImportJobRow, "diagnostics" | "payload">>)[];
    },
): Promise<ImportJob> {
  return getDb().transaction(async (tx) => {
    const failedRows = values.rows.filter((row) => row.status === "invalid").length;
    const [job] = await tx
      .insert(importJobs)
      .values({
        tenantId: values.tenantId,
        importType: values.importType,
        originalFilename: values.originalFilename,
        totalRows: values.rows.length,
        processedRows: 0,
        failedRows,
        idempotencyKey: values.idempotencyKey,
        createdByUserId: values.createdByUserId,
        metadata: values.metadata ?? {},
        status: "previewed",
      })
      .returning();

    if (!job) {
      throw new Error("Failed to create import job.");
    }

    if (values.rows.length > 0) {
      await tx.insert(importJobRows).values(
        values.rows.map((row) => ({
          tenantId: values.tenantId,
          importJobId: job.id,
          rowNumber: row.rowNumber,
          status: row.status,
          diagnostics: row.diagnostics ?? [],
          payload: row.payload ?? {},
        })),
      );
    }

    return job;
  });
}

export async function processImportJob(tenantId: string, importJobId: string): Promise<ImportJob> {
  return getDb().transaction(async (tx) => {
    const [existingJob] = await tx
      .select()
      .from(importJobs)
      .where(and(eq(importJobs.tenantId, tenantId), eq(importJobs.id, importJobId)))
      .limit(1);

    if (!existingJob) {
      throw new Error("Import job was not found.");
    }

    if (existingJob.status !== "previewed" && existingJob.status !== "processing") {
      throw new Error("Import job is locked.");
    }

    const rows = await tx
      .select()
      .from(importJobRows)
      .where(and(eq(importJobRows.tenantId, tenantId), eq(importJobRows.importJobId, importJobId)));
    const now = new Date();
    const processedRows = rows.filter((row) => row.status === "valid").length;

    const [job] = await tx
      .update(importJobs)
      .set({
        status: "processed",
        processedRows,
        lockedAt: now,
        completedAt: now,
        updatedAt: now,
      })
      .where(and(eq(importJobs.tenantId, tenantId), eq(importJobs.id, importJobId)))
      .returning();

    if (!job) {
      throw new Error("Failed to process import job.");
    }

    return job;
  });
}

export async function listExportJobsByTenant(tenantId: string): Promise<ExportJob[]> {
  return getDb()
    .select()
    .from(exportJobs)
    .where(eq(exportJobs.tenantId, tenantId))
    .orderBy(desc(exportJobs.createdAt));
}

export async function findExportJobById(
  tenantId: string,
  exportJobId: string,
): Promise<ExportJob | undefined> {
  const [job] = await getDb()
    .select()
    .from(exportJobs)
    .where(and(eq(exportJobs.tenantId, tenantId), eq(exportJobs.id, exportJobId)))
    .limit(1);

  return job;
}

export async function findExportJobByIdempotencyKey(
  tenantId: string,
  idempotencyKey: string,
): Promise<ExportJob | undefined> {
  const [job] = await getDb()
    .select()
    .from(exportJobs)
    .where(and(eq(exportJobs.tenantId, tenantId), eq(exportJobs.idempotencyKey, idempotencyKey)))
    .limit(1);

  return job;
}

export async function createExportJob(
  values: Pick<
    NewExportJob,
    | "tenantId"
    | "exportType"
    | "filename"
    | "objectKey"
    | "createdByUserId"
    | "checksumSha256"
    | "contentLength"
  > &
    Partial<Pick<NewExportJob, "filters" | "idempotencyKey">>,
): Promise<ExportJob> {
  const [job] = await getDb()
    .insert(exportJobs)
    .values({
      tenantId: values.tenantId,
      exportType: values.exportType,
      filename: values.filename,
      objectKey: values.objectKey,
      contentLength: values.contentLength,
      checksumSha256: values.checksumSha256,
      filters: values.filters ?? {},
      idempotencyKey: values.idempotencyKey,
      createdByUserId: values.createdByUserId,
      status: "completed",
    })
    .returning();

  if (!job) {
    throw new Error("Failed to create export job.");
  }

  return job;
}

export async function listSavedFiltersByTenant(tenantId: string): Promise<SavedFilter[]> {
  return getDb()
    .select()
    .from(savedFilters)
    .where(eq(savedFilters.tenantId, tenantId))
    .orderBy(asc(savedFilters.module), asc(savedFilters.name));
}

export async function createSavedFilter(
  values: Pick<NewSavedFilter, "tenantId" | "module" | "key" | "name" | "createdByUserId"> &
    Partial<Pick<NewSavedFilter, "filters">>,
): Promise<SavedFilter> {
  const [filter] = await getDb()
    .insert(savedFilters)
    .values({
      tenantId: values.tenantId,
      module: values.module,
      key: values.key,
      name: values.name,
      filters: values.filters ?? {},
      createdByUserId: values.createdByUserId,
    })
    .returning();

  if (!filter) {
    throw new Error("Failed to create saved filter.");
  }

  return filter;
}
