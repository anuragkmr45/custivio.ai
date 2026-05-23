import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Play, Plus, ScanLine, Upload } from "lucide-react";
import { useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel, MetricCard } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import {
  createAuditCampaign,
  createExportJob,
  createImportPreview,
  createSavedFilter,
  downloadExportJob,
  listAuditCampaigns,
  listExportJobs,
  listImportJobs,
  listSavedFilters,
  processImportJob,
  recordAuditScan,
  type AuditCampaign,
  type ExportJob,
  type ImportJob,
  type SavedFilter,
} from "@/lib/api/reporting";
import { listAssets } from "@/lib/api/assets";
import { unwrapApiResult } from "@/lib/api/errors";
import { createIdempotencyKey } from "@/lib/api/idempotency";
import { dateField, formatBytes, textField } from "@/lib/api/records";
import { useCurrentSession } from "@/lib/auth";
import {
  ACTION_ACCESS,
  canAccess,
  formatPermissionRequirement,
  ROUTE_ACCESS,
} from "@/lib/permission-policy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/audit-reports")({
  head: () => ({
    meta: [
      { title: "Audit & Reports - Custivio" },
      { name: "description", content: "Audit campaigns, scan findings, imports and export jobs." },
    ],
  }),
  component: AuditPage,
});

const reportingQueryKey = ["reporting", "overview"] as const;

function AuditPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canReadReportingOverview = canAccess(session, ROUTE_ACCESS.auditReports);
  const canWriteAudits = canAccess(session, ACTION_ACCESS.auditWrite);
  const canWriteImports = canAccess(session, ACTION_ACCESS.importWrite);
  const canWriteReports = canAccess(session, ACTION_ACCESS.reportWrite);
  const canReadAssets = canAccess(session, ROUTE_ACCESS.assets);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [importPreviewRows, setImportPreviewRows] = useState<Record<string, unknown>[]>([]);
  const reportingQuery = useQuery({
    queryKey: [...reportingQueryKey, session?.permissionKeys.join("|")] as const,
    queryFn: async () => {
      const [campaigns, importJobs, exportJobs, savedFilters, assets] = await Promise.all([
        canReadReportingOverview ? listAuditCampaigns() : undefined,
        canReadReportingOverview ? listImportJobs() : undefined,
        canReadReportingOverview ? listExportJobs() : undefined,
        canReadReportingOverview ? listSavedFilters() : undefined,
        canWriteAudits && canReadAssets ? listAssets() : undefined,
      ]);

      return {
        campaigns: campaigns ? unwrapApiResult(campaigns).campaigns : [],
        importJobs: importJobs ? unwrapApiResult(importJobs).importJobs : [],
        exportJobs: exportJobs ? unwrapApiResult(exportJobs).exportJobs : [],
        savedFilters: savedFilters ? unwrapApiResult(savedFilters).savedFilters : [],
        assets: assets ? unwrapApiResult(assets).assets : [],
      };
    },
    enabled: Boolean(session && canReadReportingOverview),
    refetchInterval: (query) => (hasActiveReportingJob(query.state.data) ? 30_000 : false),
  });

  const importMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setImportError(null);
      const parsed = await parseImportInput(form);
      setImportPreviewRows(parsed.rows.slice(0, 5));
      return unwrapApiResult(
        await createImportPreview({
          importType: parsed.importType,
          originalFilename: parsed.originalFilename,
          rows: parsed.rows,
          metadata: { source: "frontend", previewRows: parsed.rows.length },
          idempotencyKey: createIdempotencyKey("import"),
        }),
      ).preview;
    },
    onSuccess: async () => {
      setImportOpen(false);
      await queryClient.invalidateQueries({ queryKey: reportingQueryKey });
    },
    onError: (error) =>
      setImportError(error instanceof Error ? error.message : "Could not create import preview."),
  });

  const processMutation = useMutation({
    mutationFn: async (id: string) => unwrapApiResult(await processImportJob(id)).job,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportingQueryKey }),
  });

  const exportMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setExportError(null);
      const filters = buildExportFilters(form, data?.savedFilters ?? []);
      return unwrapApiResult(
        await createExportJob({
          exportType: String(form.get("exportType") ?? "assets"),
          filters,
          idempotencyKey: createIdempotencyKey("export"),
        }),
      ).exportJob;
    },
    onSuccess: async () => {
      setExportOpen(false);
      await queryClient.invalidateQueries({ queryKey: reportingQueryKey });
    },
    onError: (error) =>
      setExportError(error instanceof Error ? error.message : "Could not create export job."),
  });

  const campaignMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCampaignError(null);
      return unwrapApiResult(
        await createAuditCampaign({
          name: String(form.get("name") ?? ""),
          scope: String(form.get("scope") ?? "") || "all_assets",
          plannedAt: String(form.get("plannedAt") ?? "") || undefined,
        }),
      ).campaign;
    },
    onSuccess: async () => {
      setCampaignOpen(false);
      await queryClient.invalidateQueries({ queryKey: reportingQueryKey });
    },
    onError: (error) =>
      setCampaignError(error instanceof Error ? error.message : "Could not create campaign."),
  });

  const scanMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setScanError(null);
      return unwrapApiResult(
        await recordAuditScan({
          campaignId: String(form.get("campaignId") ?? ""),
          assetId: String(form.get("assetId") ?? "") || undefined,
          scanCode: String(form.get("scanCode") ?? ""),
          resultStatus: String(form.get("resultStatus") ?? "matched"),
          notes: String(form.get("notes") ?? "") || undefined,
          findingDescription: String(form.get("findingDescription") ?? "") || undefined,
          severity: String(form.get("severity") ?? "") || undefined,
        }),
      ).scan;
    },
    onSuccess: async () => {
      setScanOpen(false);
      await queryClient.invalidateQueries({ queryKey: reportingQueryKey });
    },
    onError: (error) =>
      setScanError(error instanceof Error ? error.message : "Could not submit scan."),
  });

  const filterMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setFilterError(null);
      return unwrapApiResult(
        await createSavedFilter({
          module: String(form.get("module") ?? "assets"),
          key: String(form.get("key") ?? ""),
          name: String(form.get("name") ?? ""),
          filters: { status: String(form.get("status") ?? "active") },
        }),
      ).filter;
    },
    onSuccess: async () => {
      setFilterOpen(false);
      await queryClient.invalidateQueries({ queryKey: reportingQueryKey });
    },
    onError: (error) =>
      setFilterError(error instanceof Error ? error.message : "Could not save filter."),
  });

  const downloadMutation = useMutation({
    mutationFn: async (job: ExportJob) => {
      const blob = unwrapApiResult(await downloadExportJob(job.id));
      downloadBlob(blob, textField(job, "filename", "export.json"));
    },
  });

  const data = reportingQuery.data;
  const activeCampaigns = data?.campaigns.filter((c) => c.status !== "completed").length ?? 0;
  const completedExports = data?.exportJobs.filter((j) => j.status === "completed").length ?? 0;
  const visibleTabs = [
    canReadReportingOverview && "campaigns",
    canReadReportingOverview && "imports",
    canReadReportingOverview && "exports",
    canReadReportingOverview && "filters",
  ].filter(Boolean) as string[];
  const defaultTab = visibleTabs[0];

  return (
    <>
      <PageHeader
        title="Audit & Reports"
        description="Run audit campaigns, validate imports and manage worker-backed export jobs."
        actions={
          <>
            {canReadReportingOverview && canWriteAudits && (
              <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="size-4" />
                    Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => campaignMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Create audit campaign</DialogTitle>
                      <DialogDescription>
                        Creates a backend campaign that scan results can be submitted against.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <Field name="name" label="Name" required />
                      <Field name="scope" label="Scope" placeholder="all_assets" />
                      <Field name="plannedAt" label="Planned date" type="date" />
                      {campaignError && (
                        <p className="text-sm text-[var(--destructive)]">{campaignError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCampaignOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={campaignMutation.isPending}>
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canReadReportingOverview && canWriteAudits && (
              <Dialog open={scanOpen} onOpenChange={setScanOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={!data?.campaigns.length}>
                    <ScanLine className="size-4" />
                    Scan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form action={(formData) => scanMutation.mutate(formData)} className="space-y-4">
                    <DialogHeader>
                      <DialogTitle>Submit scan</DialogTitle>
                      <DialogDescription>
                        Records audit evidence against a campaign and optional asset.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="campaignId"
                        label="Campaign"
                        options={(data?.campaigns ?? []).map((campaign) => ({
                          value: campaign.id,
                          label: textField(campaign, "name"),
                        }))}
                      />
                      <SelectField
                        name="assetId"
                        label="Asset"
                        optional
                        options={(data?.assets ?? []).map((asset) => ({
                          value: asset.id,
                          label: `${textField(asset, "assetTag")} - ${textField(asset, "name")}`,
                        }))}
                      />
                      <Field name="scanCode" label="Scan code" required />
                      <SelectField
                        name="resultStatus"
                        label="Result"
                        options={[
                          { value: "matched", label: "Matched" },
                          { value: "missing", label: "Missing" },
                          { value: "unexpected", label: "Unexpected" },
                        ]}
                      />
                      <Field name="findingDescription" label="Finding" />
                      <Field name="notes" label="Notes" />
                      {scanError && (
                        <p className="text-sm text-[var(--destructive)]">{scanError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setScanOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={scanMutation.isPending}>
                        Submit
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canReadReportingOverview && canWriteImports && (
              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Upload className="size-4" />
                    Import preview
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => importMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Create import preview</DialogTitle>
                      <DialogDescription>
                        Upload CSV/JSON or paste JSON rows. The backend creates the import job.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="importType"
                        label="Import type"
                        options={[
                          { value: "assets", label: "Assets" },
                          { value: "stock", label: "Stock" },
                          { value: "catalog", label: "Catalog" },
                        ]}
                      />
                      <Field name="originalFilename" label="Filename" placeholder="assets.csv" />
                      <div className="grid gap-1.5">
                        <Label htmlFor="importFile">CSV/JSON file</Label>
                        <Input id="importFile" name="importFile" type="file" accept=".csv,.json" />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="rowsText">Rows JSON</Label>
                        <textarea
                          id="rowsText"
                          name="rowsText"
                          className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder='[{"assetTag":"LAP-001","name":"Laptop 001"}]'
                        />
                      </div>
                      {importPreviewRows.length > 0 && (
                        <pre className="max-h-32 overflow-auto rounded-md bg-surface-2 p-2 text-xs">
                          {JSON.stringify(importPreviewRows, null, 2)}
                        </pre>
                      )}
                      {importError && (
                        <p className="text-sm text-[var(--destructive)]">{importError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={importMutation.isPending}>
                        Create preview
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canReadReportingOverview && canWriteReports && (
              <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Play className="size-4" />
                    Export job
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => exportMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Create export job</DialogTitle>
                      <DialogDescription>
                        Select export content and optional filters for the backend worker.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="exportType"
                        label="Export type"
                        options={[
                          { value: "assets", label: "Assets" },
                          { value: "stock", label: "Stock" },
                          { value: "maintenance", label: "Maintenance" },
                          { value: "audit", label: "Audit" },
                        ]}
                      />
                      <SelectField
                        name="savedFilterId"
                        label="Saved filter"
                        optional
                        options={(data?.savedFilters ?? []).map((filter) => ({
                          value: filter.id,
                          label: textField(filter, "name"),
                        }))}
                      />
                      <Field name="filterKey" label="Filter key" placeholder="status" />
                      <Field name="filterValue" label="Filter value" placeholder="in_stock" />
                      {exportError && (
                        <p className="text-sm text-[var(--destructive)]">{exportError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={exportMutation.isPending}>
                        Create export
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canReadReportingOverview && canWriteReports && (
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="size-4" />
                    Saved filter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => filterMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Create saved filter</DialogTitle>
                      <DialogDescription>Saves a reusable backend report filter.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <Field name="name" label="Name" required />
                      <Field name="key" label="Key" required />
                      <SelectField
                        name="module"
                        label="Module"
                        options={[
                          { value: "assets", label: "Assets" },
                          { value: "stock", label: "Stock" },
                          { value: "maintenance", label: "Maintenance" },
                        ]}
                      />
                      <Field name="status" label="Status filter" placeholder="active" />
                      {filterError && (
                        <p className="text-sm text-[var(--destructive)]">{filterError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setFilterOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={filterMutation.isPending}>
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />
      <PageBody>
        {!canReadReportingOverview && (
          <AccessDeniedPanel
            title="No Audit & Reports access"
            description="Use the modules available in the sidebar for your current role, or ask an administrator to assign the full audit/reporting permission set."
            required={formatPermissionRequirement(ROUTE_ACCESS.auditReports)}
          />
        )}
        {canReadReportingOverview && reportingQuery.isLoading && (
          <LoadingPanel label="Loading reporting data..." />
        )}
        {canReadReportingOverview && reportingQuery.isError && (
          <ApiErrorPanel error={reportingQuery.error} onRetry={() => reportingQuery.refetch()} />
        )}
        {canReadReportingOverview && data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {canReadReportingOverview && (
                <MetricCard
                  label="Campaigns"
                  value={data.campaigns.length}
                  hint={`${activeCampaigns} active/planned`}
                />
              )}
              {canReadReportingOverview && (
                <MetricCard label="Import jobs" value={data.importJobs.length} />
              )}
              {canReadReportingOverview && (
                <MetricCard
                  label="Export jobs"
                  value={data.exportJobs.length}
                  hint={`${completedExports} completed`}
                />
              )}
              {canReadReportingOverview && (
                <MetricCard label="Saved filters" value={data.savedFilters.length} />
              )}
            </div>

            {defaultTab && (
              <Tabs defaultValue={defaultTab}>
                <TabsList>
                  {canReadReportingOverview && (
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  )}
                  {canReadReportingOverview && (
                    <TabsTrigger value="imports">Import jobs</TabsTrigger>
                  )}
                  {canReadReportingOverview && (
                    <TabsTrigger value="exports">Export jobs</TabsTrigger>
                  )}
                  {canReadReportingOverview && (
                    <TabsTrigger value="filters">Saved filters</TabsTrigger>
                  )}
                </TabsList>
                {canReadReportingOverview && (
                  <TabsContent value="campaigns">
                    <DataTable rows={data.campaigns} columns={campaignColumns()} />
                  </TabsContent>
                )}
                {canReadReportingOverview && (
                  <TabsContent value="imports">
                    <Panel
                      title="Import jobs"
                      description="Preview and processing state from backend worker/runtime."
                      actions={
                        canWriteImports &&
                        data.importJobs[0] && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processMutation.isPending}
                            onClick={() => processMutation.mutate(data.importJobs[0].id)}
                          >
                            Process latest
                          </Button>
                        )
                      }
                      bodyClassName="p-0"
                    >
                      <p className="px-3 pt-3 text-xs text-muted-foreground">
                        Last updated {formatUpdatedAt(reportingQuery.dataUpdatedAt)}. Polling runs
                        only while jobs are actively processing.
                      </p>
                      <DataTable rows={data.importJobs} columns={importColumns()} />
                    </Panel>
                  </TabsContent>
                )}
                {canReadReportingOverview && (
                  <TabsContent value="exports">
                    <Panel
                      title="Export jobs"
                      description={`Last updated ${formatUpdatedAt(reportingQuery.dataUpdatedAt)}. Polling stops when jobs are terminal.`}
                      bodyClassName="p-0"
                    >
                      <DataTable
                        rows={data.exportJobs}
                        columns={exportColumns({
                          onDownload: (job) => downloadMutation.mutate(job),
                          busy: downloadMutation.isPending,
                        })}
                        initialSort={{ key: "requested", dir: "desc" }}
                      />
                    </Panel>
                  </TabsContent>
                )}
                {canReadReportingOverview && (
                  <TabsContent value="filters">
                    <DataTable rows={data.savedFilters} columns={filterColumns()} />
                  </TabsContent>
                )}
              </Tabs>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={required} />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  optional,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  optional?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <select
        name={name}
        required={!optional}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        {optional && <option value="">None</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

async function parseImportInput(form: FormData): Promise<{
  importType: string;
  originalFilename: string;
  rows: Record<string, unknown>[];
}> {
  const importType = String(form.get("importType") ?? "assets") || "assets";
  const file = form.get("importFile");
  const pastedRows = String(form.get("rowsText") ?? "").trim();
  let source = pastedRows;
  let originalFilename = String(form.get("originalFilename") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    source = await file.text();
    originalFilename ||= file.name;
  }

  if (!source) {
    throw new Error("Provide a CSV/JSON file or paste JSON rows.");
  }

  const rows = source.trim().startsWith("[") ? parseJsonRows(source) : parseCsvRows(source);
  if (rows.length === 0) throw new Error("Import input did not contain any rows.");

  return {
    importType,
    originalFilename: originalFilename || `${importType}-import.json`,
    rows,
  };
}

function parseJsonRows(source: string): Record<string, unknown>[] {
  const parsed = JSON.parse(source) as unknown;
  if (!Array.isArray(parsed)) throw new Error("JSON import input must be an array of row objects.");
  return parsed.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`Import row ${index + 1} must be an object.`);
    }
    return row as Record<string, unknown>;
  });
}

function parseCsvRows(source: string): Record<string, unknown>[] {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV input needs a header row and at least one data row.");
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function buildExportFilters(
  form: FormData,
  savedFilters: SavedFilter[],
): Record<string, unknown> | undefined {
  const savedFilterId = String(form.get("savedFilterId") ?? "");
  const selectedFilter = savedFilters.find((filter) => filter.id === savedFilterId);
  const filters: Record<string, unknown> = { ...(selectedFilter?.filters ?? {}) };
  const filterKey = String(form.get("filterKey") ?? "").trim();
  const filterValue = String(form.get("filterValue") ?? "").trim();

  if (filterKey && filterValue) {
    filters[filterKey] = filterValue;
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
}

function hasActiveReportingJob(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const overview = data as {
    importJobs?: Array<Pick<ImportJob, "status">>;
    exportJobs?: Array<Pick<ExportJob, "status">>;
  };

  return [...(overview.importJobs ?? []), ...(overview.exportJobs ?? [])].some((job) =>
    isActiveJobStatus(job.status),
  );
}

function isActiveJobStatus(status: string | undefined): boolean {
  return ["pending", "queued", "processing", "running"].includes(status ?? "");
}

function formatUpdatedAt(value: number): string {
  return value > 0 ? new Date(value).toLocaleTimeString() : "after the first load";
}

function campaignColumns(): Column<AuditCampaign>[] {
  return [
    {
      key: "id",
      header: "Campaign",
      cell: (r) => <span className="font-mono text-xs text-accent">{r.id.slice(0, 8)}</span>,
      searchValue: (r) => `${r.id} ${textField(r, "name", "")} ${textField(r, "scope", "")}`,
    },
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <div>
          <div className="font-medium">{textField(r, "name")}</div>
          <div className="text-xs text-muted-foreground">{textField(r, "scope")}</div>
        </div>
      ),
    },
    { key: "planned", header: "Planned", cell: (r) => dateField(r, "plannedAt") },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "pending")} />,
    },
  ];
}

function importColumns(): Column<ImportJob>[] {
  return [
    {
      key: "file",
      header: "File",
      cell: (r) => <span className="font-medium">{textField(r, "originalFilename")}</span>,
    },
    { key: "type", header: "Type", cell: (r) => textField(r, "importType") },
    {
      key: "total",
      header: "Rows",
      align: "right",
      cell: (r) => `${r.processedRows ?? 0}/${r.totalRows ?? 0}`,
    },
    { key: "failed", header: "Failed", align: "right", cell: (r) => r.failedRows ?? 0 },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "pending")} />,
    },
    { key: "created", header: "Created", cell: (r) => dateField(r, "createdAt") },
  ];
}

function exportColumns({
  onDownload,
  busy,
}: {
  onDownload: (job: ExportJob) => void;
  busy: boolean;
}): Column<ExportJob>[] {
  return [
    {
      key: "id",
      header: "Job",
      cell: (r) => <span className="font-mono text-xs text-accent">{r.id.slice(0, 8)}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium">{textField(r, "filename")}</span>,
      searchValue: (r) => `${r.id} ${textField(r, "filename", "")}`,
    },
    { key: "type", header: "Type", cell: (r) => textField(r, "exportType") },
    { key: "size", header: "Size", align: "right", cell: (r) => formatBytes(r.contentLength) },
    {
      key: "requested",
      header: "Requested",
      cell: (r) => <span className="font-mono text-xs">{dateField(r, "createdAt")}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "pending")} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) =>
        r.status === "completed" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDownload(r)}>
            <Download className="size-4" />
            Download
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];
}

function filterColumns(): Column<SavedFilter>[] {
  return [
    {
      key: "name",
      header: "Filter",
      cell: (r) => <span className="font-medium">{textField(r, "name")}</span>,
      searchValue: (r) => textField(r, "name", ""),
    },
    { key: "scope", header: "Module", cell: (r) => textField(r, "module") },
    {
      key: "key",
      header: "Key",
      cell: (r) => <span className="font-mono text-xs">{textField(r, "key")}</span>,
    },
    {
      key: "lastRun",
      header: "Created",
      cell: (r) => <span className="font-mono text-xs">{dateField(r, "createdAt")}</span>,
    },
  ];
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
