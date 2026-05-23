import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { assets } from "./assets";
import { createdAtOnly, id, timestamps } from "./common";
import { tenants } from "./tenants";
import { users } from "./users";

export const auditCampaigns = pgTable(
  "audit_campaigns",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 180 }).notNull(),
    scope: varchar("scope", { length: 120 }).notNull().default("all_assets"),
    status: varchar("status", { length: 40 }).notNull().default("planned"),
    plannedAt: timestamp("planned_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("audit_campaigns_tenant_status_idx").on(table.tenantId, table.status),
    index("audit_campaigns_tenant_scope_idx").on(table.tenantId, table.scope),
  ],
);

export const auditScanResults = pgTable(
  "audit_scan_results",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => auditCampaigns.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    scanCode: varchar("scan_code", { length: 180 }).notNull(),
    resultStatus: varchar("result_status", { length: 40 }).notNull(),
    notes: varchar("notes", { length: 500 }),
    scannedByUserId: uuid("scanned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("audit_scan_results_tenant_campaign_idx").on(table.tenantId, table.campaignId),
    index("audit_scan_results_tenant_status_idx").on(table.tenantId, table.resultStatus),
    uniqueIndex("audit_scan_results_campaign_code_unique").on(table.campaignId, table.scanCode),
  ],
);

export const auditFindings = pgTable(
  "audit_findings",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => auditCampaigns.id, { onDelete: "cascade" }),
    scanResultId: uuid("scan_result_id").references(() => auditScanResults.id, {
      onDelete: "set null",
    }),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    severity: varchar("severity", { length: 40 }).notNull().default("medium"),
    status: varchar("status", { length: 40 }).notNull().default("open"),
    description: varchar("description", { length: 500 }).notNull(),
    resolution: varchar("resolution", { length: 500 }),
    ...timestamps,
  },
  (table) => [
    index("audit_findings_tenant_campaign_idx").on(table.tenantId, table.campaignId),
    index("audit_findings_tenant_status_idx").on(table.tenantId, table.status),
    index("audit_findings_tenant_severity_idx").on(table.tenantId, table.severity),
  ],
);

export const importJobs = pgTable(
  "import_jobs",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    importType: varchar("import_type", { length: 80 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("previewed"),
    originalFilename: varchar("original_filename", { length: 260 }).notNull(),
    totalRows: integer("total_rows").notNull().default(0),
    processedRows: integer("processed_rows").notNull().default(0),
    failedRows: integer("failed_rows").notNull().default(0),
    idempotencyKey: varchar("idempotency_key", { length: 160 }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (table) => [
    index("import_jobs_tenant_status_idx").on(table.tenantId, table.status),
    uniqueIndex("import_jobs_tenant_idempotency_unique").on(table.tenantId, table.idempotencyKey),
  ],
);

export const importJobRows = pgTable(
  "import_job_rows",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    importJobId: uuid("import_job_id")
      .notNull()
      .references(() => importJobs.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    diagnostics: jsonb("diagnostics")
      .notNull()
      .default(sql`'[]'::jsonb`),
    payload: jsonb("payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    ...createdAtOnly,
  },
  (table) => [
    uniqueIndex("import_job_rows_job_row_unique").on(table.importJobId, table.rowNumber),
    index("import_job_rows_tenant_job_idx").on(table.tenantId, table.importJobId),
    index("import_job_rows_tenant_status_idx").on(table.tenantId, table.status),
  ],
);

export const exportJobs = pgTable(
  "export_jobs",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    exportType: varchar("export_type", { length: 80 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("completed"),
    filename: varchar("filename", { length: 260 }).notNull(),
    objectKey: varchar("object_key", { length: 520 }).notNull(),
    contentLength: integer("content_length"),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    filters: jsonb("filters")
      .notNull()
      .default(sql`'{}'::jsonb`),
    idempotencyKey: varchar("idempotency_key", { length: 160 }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("export_jobs_object_key_unique").on(table.objectKey),
    uniqueIndex("export_jobs_tenant_idempotency_unique").on(table.tenantId, table.idempotencyKey),
    index("export_jobs_tenant_type_idx").on(table.tenantId, table.exportType),
  ],
);

export const savedFilters = pgTable(
  "saved_filters",
  {
    ...id,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    module: varchar("module", { length: 80 }).notNull(),
    key: varchar("key", { length: 120 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    filters: jsonb("filters")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("saved_filters_tenant_module_key_unique").on(
      table.tenantId,
      table.module,
      table.key,
    ),
    index("saved_filters_tenant_module_idx").on(table.tenantId, table.module),
  ],
);

export type AuditCampaign = typeof auditCampaigns.$inferSelect;
export type NewAuditCampaign = typeof auditCampaigns.$inferInsert;
export type AuditScanResult = typeof auditScanResults.$inferSelect;
export type NewAuditScanResult = typeof auditScanResults.$inferInsert;
export type AuditFinding = typeof auditFindings.$inferSelect;
export type NewAuditFinding = typeof auditFindings.$inferInsert;
export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;
export type ImportJobRow = typeof importJobRows.$inferSelect;
export type NewImportJobRow = typeof importJobRows.$inferInsert;
export type ExportJob = typeof exportJobs.$inferSelect;
export type NewExportJob = typeof exportJobs.$inferInsert;
export type SavedFilter = typeof savedFilters.$inferSelect;
export type NewSavedFilter = typeof savedFilters.$inferInsert;
