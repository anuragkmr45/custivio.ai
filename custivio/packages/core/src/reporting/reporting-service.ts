import { randomUUID } from "node:crypto";

import { requirePermission } from "@custivio/auth";
import {
  appendAuditLog,
  createAuditCampaign,
  createExportJob,
  createImportJobWithRows,
  createSavedFilter,
  findAssetById,
  findAuditCampaignById,
  findExportJobById,
  findExportJobByIdempotencyKey,
  findImportJobByIdempotencyKey,
  listAssetsByTenant,
  listAuditCampaignsByTenant,
  listAuditFindingsByTenant,
  listAuditScansByTenant,
  listExportJobsByTenant,
  listImportJobsByTenant,
  listImportRowsByJob,
  listSavedFiltersByTenant,
  processImportJob,
  recordAuditScan,
  type AuditCampaign,
  type AuditFinding,
  type AuditScanResult,
  type ExportJob,
  type ImportJob,
  type ImportJobRow,
  type SavedFilter,
} from "@custivio/db";
import {
  calculateSha256Hex,
  createContentDisposition,
  createExportObjectKey,
  deleteObject,
  getObject,
  putObject,
  type StoredObject,
} from "@custivio/storage";
import { recordExportJob, recordFileOperation, recordImportJob } from "@custivio/telemetry";

import {
  createIdempotencyFingerprint,
  readIdempotencyFingerprint,
  withIdempotencyFingerprint,
} from "../security/idempotency-service";

import { ReportingError } from "./errors";

export interface ReportingOverview {
  campaigns: AuditCampaign[];
  scans: AuditScanResult[];
  findings: AuditFinding[];
  importJobs: ImportJob[];
  exportJobs: ExportJob[];
  savedFilters: SavedFilter[];
}

export interface ImportPreviewResult {
  job: ImportJob;
  rows: ImportJobRow[];
}

export interface ExportDownload {
  contentDisposition: string;
  exportJob: ExportJob;
  object: StoredObject;
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
    throw new ReportingError("invalid_reporting_input", `${key} is required.`, 400);
  }

  return value;
}

function readOptionalDate(input: Record<string, unknown>, key: string): Date | undefined {
  const value = readOptionalString(input, key);

  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ReportingError("invalid_reporting_input", `${key} must be a valid date.`, 400);
  }

  return date;
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

  throw new ReportingError("invalid_reporting_input", `${key} must be an object.`, 400);
}

function readRows(input: Record<string, unknown>): unknown[] {
  const value = input.rows;

  if (typeof value === "string") {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed;
    }
  }

  if (Array.isArray(value)) {
    return value;
  }

  throw new ReportingError("invalid_import_rows", "rows must be an array.", 400);
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createImportRows(rows: unknown[]) {
  return rows.map((row, index) => {
    const isObject = row && typeof row === "object" && !Array.isArray(row);
    const payload = isObject ? (row as Record<string, unknown>) : {};
    const diagnostics = isObject ? [] : ["Row must be an object."];

    return {
      rowNumber: index + 1,
      status: diagnostics.length === 0 ? "valid" : "invalid",
      diagnostics,
      payload,
    };
  });
}

async function writeReportingAudit(
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

function assertReportingIdempotencyReplay(metadata: unknown, requestHash: string): void {
  const existingHash = readIdempotencyFingerprint(metadata);

  if (existingHash && existingHash !== requestHash) {
    throw new ReportingError(
      "idempotency_conflict",
      "Idempotency key was already used with a different request.",
      409,
    );
  }
}

export async function listReportingOverview(
  sessionToken: string | undefined,
): Promise<ReportingOverview> {
  const session = await requirePermission(sessionToken, "audits.read");
  await requirePermission(sessionToken, "imports.read");
  await requirePermission(sessionToken, "reports.read");

  const [campaigns, scans, findings, importJobs, exportJobs, savedFilters] = await Promise.all([
    listAuditCampaignsByTenant(session.tenant.id),
    listAuditScansByTenant(session.tenant.id),
    listAuditFindingsByTenant(session.tenant.id),
    listImportJobsByTenant(session.tenant.id),
    listExportJobsByTenant(session.tenant.id),
    listSavedFiltersByTenant(session.tenant.id),
  ]);

  return { campaigns, scans, findings, importJobs, exportJobs, savedFilters };
}

export async function createAuditCampaignForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AuditCampaign> {
  const session = await requirePermission(sessionToken, "audits.write");
  const campaign = await createAuditCampaign({
    tenantId: session.tenant.id,
    name: requireString(input, "name"),
    scope: readOptionalString(input, "scope"),
    plannedAt: readOptionalDate(input, "plannedAt"),
    createdByUserId: session.user.id,
  });

  await writeReportingAudit(
    session.tenant.id,
    session.user.id,
    "audit_campaign.created",
    "audit_campaign",
    campaign.id,
    requestId,
  );

  return campaign;
}

export async function recordAuditScanForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<AuditScanResult> {
  const session = await requirePermission(sessionToken, "audits.write");
  const campaignId = requireString(input, "campaignId");
  const assetId = readOptionalString(input, "assetId");
  const resultStatus = requireString(input, "resultStatus");
  const findingDescription = readOptionalString(input, "findingDescription");

  if (!(await findAuditCampaignById(session.tenant.id, campaignId))) {
    throw new ReportingError("campaign_not_found", "Audit campaign was not found.", 404);
  }

  if (assetId && !(await findAssetById(session.tenant.id, assetId))) {
    throw new ReportingError("asset_not_found", "Asset was not found.", 404);
  }

  const result = await recordAuditScan({
    tenantId: session.tenant.id,
    campaignId,
    assetId,
    scanCode: requireString(input, "scanCode"),
    resultStatus,
    notes: readOptionalString(input, "notes"),
    scannedByUserId: session.user.id,
    ...(findingDescription
      ? {
          finding: {
            severity: readOptionalString(input, "severity") ?? "medium",
            description: findingDescription,
          },
        }
      : {}),
  });

  await writeReportingAudit(
    session.tenant.id,
    session.user.id,
    "audit_scan.recorded",
    "audit_scan",
    result.scan.id,
    requestId,
  );

  return result.scan;
}

export async function createImportPreviewForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<ImportPreviewResult> {
  const session = await requirePermission(sessionToken, "imports.write");
  const idempotencyKey = readOptionalString(input, "idempotencyKey");
  const importType = requireString(input, "importType");
  const originalFilename = requireString(input, "originalFilename");
  const metadata = readJsonObject(input, "metadata");
  const sourceRows = readRows(input);
  const rows = createImportRows(sourceRows);
  const requestHash = idempotencyKey
    ? createIdempotencyFingerprint({
        importType,
        metadata,
        originalFilename,
        rows: sourceRows,
      })
    : undefined;

  if (idempotencyKey) {
    const existing = await findImportJobByIdempotencyKey(session.tenant.id, idempotencyKey);

    if (existing) {
      assertReportingIdempotencyReplay(existing.metadata, requestHash ?? "");

      return {
        job: existing,
        rows: await listImportRowsByJob(session.tenant.id, existing.id),
      };
    }
  }

  const job = await createImportJobWithRows({
    tenantId: session.tenant.id,
    importType,
    originalFilename,
    idempotencyKey,
    createdByUserId: session.user.id,
    metadata: requestHash ? withIdempotencyFingerprint(metadata, requestHash) : metadata,
    rows,
  });

  await writeReportingAudit(
    session.tenant.id,
    session.user.id,
    "import.previewed",
    "import_job",
    job.id,
    requestId,
  );
  recordImportJob("pending");

  return { job, rows: await listImportRowsByJob(session.tenant.id, job.id) };
}

export async function processImportJobForSession(
  sessionToken: string | undefined,
  importJobId: string,
  requestId?: string,
): Promise<ImportJob> {
  const session = await requirePermission(sessionToken, "imports.write");

  try {
    const job = await processImportJob(session.tenant.id, importJobId);

    await writeReportingAudit(
      session.tenant.id,
      session.user.id,
      "import.processed",
      "import_job",
      job.id,
      requestId,
    );
    recordImportJob("completed");

    return job;
  } catch (error) {
    if (error instanceof Error && error.message.includes("locked")) {
      throw new ReportingError("import_job_locked", "Import job is already locked.", 409);
    }

    if (error instanceof Error && error.message.includes("not found")) {
      throw new ReportingError("import_job_not_found", "Import job was not found.", 404);
    }

    throw error;
  }
}

export async function createExportJobForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<ExportJob> {
  const session = await requirePermission(sessionToken, "reports.write");
  const idempotencyKey = readOptionalString(input, "idempotencyKey");
  const exportType = requireString(input, "exportType");
  const filters = readJsonObject(input, "filters");
  const requestHash = idempotencyKey
    ? createIdempotencyFingerprint({
        exportType,
        filters,
      })
    : undefined;

  if (idempotencyKey) {
    const existing = await findExportJobByIdempotencyKey(session.tenant.id, idempotencyKey);

    if (existing) {
      const existingHash = createIdempotencyFingerprint({
        exportType: existing.exportType,
        filters: existing.filters,
      });

      if (requestHash && existingHash !== requestHash) {
        throw new ReportingError(
          "idempotency_conflict",
          "Idempotency key was already used with a different export request.",
          409,
        );
      }

      return existing;
    }
  }

  const exportObjectId = randomUUID();
  const filename = `${normalizeKey(exportType) || "export"}-${exportObjectId}.json`;
  const objectKey = createExportObjectKey(session.tenant.id, exportObjectId, filename);
  const assets = await listAssetsByTenant(session.tenant.id);
  const body = new TextEncoder().encode(
    JSON.stringify(
      {
        exportType,
        filters,
        generatedAt: new Date().toISOString(),
        tenantId: session.tenant.id,
        counts: {
          assets: assets.length,
        },
      },
      null,
      2,
    ),
  );
  const checksumSha256 = calculateSha256Hex(body);
  const contentLength = body.byteLength;

  await putObject(objectKey, body, "application/json");

  let job: ExportJob;

  try {
    job = await createExportJob({
      tenantId: session.tenant.id,
      exportType,
      filename,
      objectKey,
      contentLength,
      checksumSha256,
      filters,
      idempotencyKey,
      createdByUserId: session.user.id,
    });
  } catch (error) {
    await deleteObject(objectKey);
    recordExportJob("failed");

    throw error;
  }

  await writeReportingAudit(
    session.tenant.id,
    session.user.id,
    "export.created",
    "export_job",
    job.id,
    requestId,
  );
  recordExportJob("completed");

  return job;
}

export async function createSavedFilterForSession(
  sessionToken: string | undefined,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<SavedFilter> {
  const session = await requirePermission(sessionToken, "reports.write");
  const key = normalizeKey(requireString(input, "key"));

  if (key.length === 0) {
    throw new ReportingError("invalid_reporting_input", "key is invalid.", 400);
  }

  const filter = await createSavedFilter({
    tenantId: session.tenant.id,
    module: requireString(input, "module"),
    key,
    name: requireString(input, "name"),
    filters: readJsonObject(input, "filters"),
    createdByUserId: session.user.id,
  });

  await writeReportingAudit(
    session.tenant.id,
    session.user.id,
    "saved_filter.created",
    "saved_filter",
    filter.id,
    requestId,
  );

  return filter;
}

export async function getExportDownloadForSession(
  sessionToken: string | undefined,
  exportJobId: string,
  requestId?: string,
): Promise<ExportDownload> {
  const session = await requirePermission(sessionToken, "reports.read");
  const exportJob = await findExportJobById(session.tenant.id, exportJobId);

  if (exportJob?.status !== "completed") {
    throw new ReportingError("export_not_found", "Export job was not found.", 404);
  }

  let object: StoredObject;

  try {
    object = await getObject(exportJob.objectKey);
  } catch {
    recordFileOperation("export_download", "failure");
    throw new ReportingError("export_object_not_found", "Export object was not found.", 404);
  }

  if (exportJob.checksumSha256 && calculateSha256Hex(object.body) !== exportJob.checksumSha256) {
    recordFileOperation("export_download", "failure");
    throw new ReportingError(
      "export_checksum_mismatch",
      "Export checksum did not match stored metadata.",
      409,
    );
  }

  await writeReportingAudit(
    session.tenant.id,
    session.user.id,
    "export.downloaded",
    "export_job",
    exportJob.id,
    requestId,
  );
  recordFileOperation("export_download", "success");

  return {
    contentDisposition: createContentDisposition(exportJob.filename),
    exportJob,
    object,
  };
}
