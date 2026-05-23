import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, QrCode, FileEdit, History, Paperclip, Plus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import {
  AssetLocationValue,
  CustodianValue,
  RelatedRecordValue,
} from "@/components/data/AssetReferenceValue";
import { CopyableId } from "@/components/data/CopyableId";
import { AssetQrCode } from "@/components/data/AssetQrCode";
import { PageHeader, PageBody, Panel, KeyValue } from "@/components/data/Panel";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AssetFormFields } from "@/components/assets/AssetFormFields";
import {
  addAssetLifecycleEvent,
  deleteAssetAttachment,
  downloadAssetAttachment,
  getAssetDetail,
  updateAsset,
  uploadAssetAttachment,
  type AssetAttachment,
} from "@/lib/api/assets";
import { listUsers } from "@/lib/api/admin";
import { listCatalogRecords } from "@/lib/api/catalog";
import { getCustodyOverview } from "@/lib/api/custody";
import { listLocationRecords } from "@/lib/api/locations";
import { unwrapApiResult } from "@/lib/api/errors";
import { dateField, formatBytes, textField } from "@/lib/api/records";
import { useCurrentSession } from "@/lib/auth";
import {
  buildAssetReferenceLookups,
  customFieldsForAssetType,
  emptyAssetReferenceData,
  formatAssetLocation,
  formatCustodian,
  formatRelatedRecord,
  type AssetReferenceData,
} from "@/lib/asset-display";
import { buildCustomFieldValues } from "@/lib/asset-form-values";
import {
  buildAssetQrPrintHtml,
  createQrDataUrl,
  resolveAssetQrPayload,
  type AssetQrPrintInfo,
} from "@/lib/qr";
import {
  ACTION_ACCESS,
  canAccess,
  formatPermissionRequirement,
  ROUTE_ACCESS,
} from "@/lib/permission-policy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/assets/$assetId")({
  head: () => ({
    meta: [
      { title: "Asset - Custivio" },
      {
        name: "description",
        content: "Asset detail with lifecycle, custody, attachments and maintenance.",
      },
    ],
  }),
  component: AssetDetail,
});

const maxAttachmentUploadBytes = 10 * 1024 * 1024;

function AssetDetail() {
  const { assetId } = Route.useParams();
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canViewAsset = canAccess(session, ROUTE_ACCESS.assetDetail);
  const canReadCatalog = canAccess(session, ROUTE_ACCESS.catalog);
  const canReadLocations = canAccess(session, ACTION_ACCESS.locationManage);
  const canReadCustody = canAccess(session, ROUTE_ACCESS.custody);
  const canReadUsers = canAccess(session, ROUTE_ACCESS.users);
  const canEditAsset = canAccess(session, ACTION_ACCESS.assetEdit);
  const canAddLifecycleEvent = canAccess(session, ACTION_ACCESS.assetLifecycle);
  const canUploadAttachment = canAccess(session, ACTION_ACCESS.assetAttachmentUpload);
  const canDeleteAttachment = canAccess(session, ACTION_ACCESS.assetAttachmentDelete);
  const canDownloadAttachment = canAccess(session, ACTION_ACCESS.assetAttachmentDownload);
  const canUseCustody = canAccess(session, ACTION_ACCESS.custodyWrite);
  const canUseMaintenance = canAccess(session, ACTION_ACCESS.maintenanceWrite);
  const canUseAuditScan =
    canAccess(session, ROUTE_ACCESS.auditReports) && canAccess(session, ACTION_ACCESS.auditWrite);
  const [editOpen, setEditOpen] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [uploadValidationError, setUploadValidationError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ name: string; size: number } | null>(null);
  const detailQueryKey = ["assets", "detail", assetId] as const;

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: async () => unwrapApiResult(await getAssetDetail(assetId)).detail,
    enabled: canViewAsset,
  });

  const assetReferenceQuery = useQuery({
    queryKey: [
      "assets",
      "detail-reference-data",
      canReadCatalog,
      canReadLocations,
      canReadCustody,
      canReadUsers,
    ],
    queryFn: async () =>
      loadAssetReferenceData({
        canReadCatalog,
        canReadLocations,
        canReadCustody,
        canReadUsers,
      }),
    enabled: canViewAsset && (canReadCatalog || canReadLocations || canReadCustody || canReadUsers),
  });

  const assetReferenceData = assetReferenceQuery.data ?? emptyAssetReferenceData;
  const assetLookups = useMemo(
    () => buildAssetReferenceLookups(assetReferenceData),
    [assetReferenceData],
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) =>
      unwrapApiResult(await uploadAssetAttachment(assetId, file, file.name)).attachment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailQueryKey }),
    onSettled: () => setPendingUpload(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) =>
      unwrapApiResult(await deleteAssetAttachment(assetId, attachmentId)).attachment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailQueryKey }),
  });

  const downloadMutation = useMutation({
    mutationFn: async (attachment: AssetAttachment) => {
      const blob = unwrapApiResult(await downloadAssetAttachment(assetId, attachment.id));
      downloadBlob(blob, textField(attachment, "filename", "attachment"));
    },
  });

  const editMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setEditError(null);
      return unwrapApiResult(
        await updateAsset(assetId, {
          assetTypeId: String(form.get("assetTypeId") ?? "") || undefined,
          modelId: String(form.get("modelId") ?? "") || undefined,
          vendorId: String(form.get("vendorId") ?? "") || undefined,
          siteId: String(form.get("siteId") ?? "") || undefined,
          buildingId: String(form.get("buildingId") ?? "") || undefined,
          floorId: String(form.get("floorId") ?? "") || undefined,
          roomId: String(form.get("roomId") ?? "") || undefined,
          rackId: String(form.get("rackId") ?? "") || undefined,
          shelfId: String(form.get("shelfId") ?? "") || undefined,
          binId: String(form.get("binId") ?? "") || undefined,
          custodianUserId: String(form.get("custodianUserId") ?? "") || undefined,
          serialNumber: String(form.get("serialNumber") ?? "") || undefined,
          name: String(form.get("name") ?? ""),
          status: String(form.get("status") ?? "") || undefined,
          condition: String(form.get("condition") ?? "") || undefined,
          customFields: buildCustomFieldValues(
            form,
            customFieldsForAssetType(
              assetReferenceData.customFields,
              String(form.get("assetTypeId") ?? ""),
            ),
          ),
        }),
      ).asset;
    },
    onSuccess: async () => {
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error) => {
      setEditError(error instanceof Error ? error.message : "Could not update asset.");
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setLifecycleError(null);
      const metadataText = String(form.get("metadata") ?? "").trim();
      let metadata: Record<string, unknown> | undefined;
      if (metadataText) {
        const parsed = JSON.parse(metadataText) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Metadata must be a JSON object.");
        }
        metadata = parsed as Record<string, unknown>;
      }
      return unwrapApiResult(
        await addAssetLifecycleEvent(assetId, {
          eventType: String(form.get("eventType") ?? ""),
          metadata,
        }),
      ).event;
    },
    onSuccess: async () => {
      setLifecycleOpen(false);
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
    onError: (error) => {
      setLifecycleError(
        error instanceof Error ? error.message : "Could not create lifecycle event.",
      );
    },
  });

  const detail = detailQuery.data;
  const asset = detail?.asset;
  const locationLabel = asset ? formatAssetLocation(asset, assetLookups) : "Not assigned";
  const assetTypeLabel = asset
    ? formatRelatedRecord(assetLookups.types, asset.assetTypeId)
    : "Loading";
  const modelLabel = asset
    ? formatRelatedRecord(assetLookups.models, asset.modelId, "No model")
    : "";
  const vendorLabel = asset
    ? formatRelatedRecord(assetLookups.vendors, asset.vendorId, "No vendor")
    : "";
  const custodianLabel = asset
    ? formatCustodian(assetLookups, asset.custodianUserId)
    : "Unassigned";
  const qrPayload = asset ? resolveAssetQrPayload(detail?.qrPayload, asset.id) : "";

  if (!canViewAsset) {
    return (
      <>
        <PageHeader title="Asset" description="Asset detail with lifecycle and attachments." />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot view asset details."
            required={formatPermissionRequirement(ROUTE_ACCESS.assetDetail)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={asset ? `${textField(asset, "name")} · ${textField(asset, "assetTag")}` : "Asset"}
        description={
          asset
            ? `Serial ${textField(asset, "serialNumber")} · ${assetTypeLabel}`
            : "Loading backend asset detail."
        }
        meta={
          asset && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={textField(asset, "status", "active")} />
              <StatusBadge status={textField(asset, "condition", "good")} />
              <span>
                Location: <span className="text-foreground">{locationLabel}</span>
              </span>
            </div>
          )
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/assets">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!detail}
              onClick={() =>
                asset &&
                void printAssetQrLabel({
                  payload: qrPayload,
                  assetTag: textField(asset, "assetTag"),
                  name: textField(asset, "name"),
                  serialNumber: textField(asset, "serialNumber"),
                  location: locationLabel,
                })
              }
            >
              <QrCode className="size-4" />
              Print QR
            </Button>
            {canEditAsset && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <FileEdit className="size-4" />
                    Edit asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
                  <form
                    action={(formData) => editMutation.mutate(formData)}
                    className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden"
                  >
                    <DialogHeader className="px-6 pt-6">
                      <DialogTitle>Edit asset</DialogTitle>
                      <DialogDescription>
                        Update readable asset details with catalog, location and custodian choices.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 overflow-y-auto px-6 py-5">
                      {assetReferenceQuery.isLoading && (
                        <LoadingPanel label="Loading catalog and location choices..." />
                      )}
                      {assetReferenceQuery.isError && (
                        <ApiErrorPanel
                          error={assetReferenceQuery.error}
                          onRetry={() => assetReferenceQuery.refetch()}
                        />
                      )}
                      <AssetFormFields
                        referenceData={assetReferenceData}
                        asset={asset}
                        mode="edit"
                      />
                      {editError && (
                        <p className="text-sm text-[var(--destructive)]">{editError}</p>
                      )}
                    </div>
                    <DialogFooter className="border-t border-border bg-background px-6 py-4">
                      <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          editMutation.isPending ||
                          assetReferenceQuery.isLoading ||
                          assetReferenceData.types.length === 0
                        }
                      >
                        Save asset
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
        {detailQuery.isLoading && <LoadingPanel label="Loading asset detail..." />}
        {detailQuery.isError && (
          <ApiErrorPanel error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
        )}
        {detail && asset && (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <Tabs defaultValue="overview" className="min-w-0 w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="lifecycle">
                  <History className="size-3.5" />
                  Lifecycle
                </TabsTrigger>
                <TabsTrigger value="maintenance">
                  <Wrench className="size-3.5" />
                  Maintenance
                </TabsTrigger>
                <TabsTrigger value="attachments">
                  <Paperclip className="size-3.5" />
                  Attachments
                </TabsTrigger>
                <TabsTrigger value="qr">QR label</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Panel>
                  <dl className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                    <KeyValue label="Asset tag">{textField(asset, "assetTag")}</KeyValue>
                    <KeyValue label="Serial">{textField(asset, "serialNumber")}</KeyValue>
                    <KeyValue label="Asset type">
                      <RelatedRecordValue
                        map={assetLookups.types}
                        id={asset.assetTypeId}
                        label="Asset type ID"
                      />
                    </KeyValue>
                    <KeyValue label="Model">
                      <RelatedRecordValue
                        map={assetLookups.models}
                        id={asset.modelId}
                        label="Model ID"
                        fallback="No model"
                      />
                    </KeyValue>
                    <KeyValue label="Vendor">
                      <RelatedRecordValue
                        map={assetLookups.vendors}
                        id={asset.vendorId}
                        label="Vendor ID"
                        fallback="No vendor"
                      />
                    </KeyValue>
                    <KeyValue label="Custodian">
                      <CustodianValue users={assetLookups.users} id={asset.custodianUserId} />
                    </KeyValue>
                    <KeyValue label="Location">
                      <AssetLocationValue asset={asset} lookups={assetLookups} />
                    </KeyValue>
                    <KeyValue label="Created">{dateField(asset, "createdAt")}</KeyValue>
                    <KeyValue label="Updated">{dateField(asset, "updatedAt")}</KeyValue>
                  </dl>
                </Panel>
              </TabsContent>

              <TabsContent value="lifecycle">
                <Panel
                  title="Lifecycle events"
                  description={`${detail.lifecycleEvents.length} events recorded.`}
                  actions={
                    canAddLifecycleEvent ? (
                      <Dialog open={lifecycleOpen} onOpenChange={setLifecycleOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="size-4" />
                            Add event
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <form
                            action={(formData) => lifecycleMutation.mutate(formData)}
                            className="space-y-4"
                          >
                            <DialogHeader>
                              <DialogTitle>Add lifecycle event</DialogTitle>
                              <DialogDescription>
                                Records a backend lifecycle event with optional JSON metadata.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-3">
                              <Field
                                name="eventType"
                                label="Event type"
                                defaultValue="updated"
                                required
                              />
                              <Field
                                name="metadata"
                                label="Metadata JSON"
                                defaultValue='{"source":"frontend"}'
                              />
                              {lifecycleError && (
                                <p className="text-sm text-[var(--destructive)]">
                                  {lifecycleError}
                                </p>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setLifecycleOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={lifecycleMutation.isPending}>
                                Add event
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    ) : null
                  }
                >
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {detail.lifecycleEvents.length === 0 && (
                      <li className="text-sm text-muted-foreground">No events recorded.</li>
                    )}
                    {detail.lifecycleEvents.map((event) => (
                      <li key={event.id} className="relative">
                        <span className="absolute -left-[26px] mt-1 size-2.5 rounded-full bg-accent ring-4 ring-card" />
                        <div className="text-xs text-muted-foreground">
                          {dateField(event, ["createdAt", "occurredAt"])}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium text-foreground">
                            {textField(event, "eventType").replace("_", " ")}
                          </div>
                          <CopyableId value={event.id} label="Lifecycle event ID" />
                        </div>
                        <pre className="mt-1 max-w-full overflow-x-auto rounded-md bg-surface-2 p-2 text-xs text-muted-foreground">
                          {JSON.stringify(event.metadata ?? {}, null, 2)}
                        </pre>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </TabsContent>

              <TabsContent value="maintenance">
                <Panel title="Linked maintenance">
                  <p className="text-sm text-muted-foreground">
                    Maintenance tickets are available in the Maintenance module for{" "}
                    <span className="font-medium text-foreground">
                      {textField(asset, "assetTag")}
                    </span>
                    .
                  </p>
                </Panel>
              </TabsContent>

              <TabsContent value="attachments">
                <Panel
                  title="Attachments"
                  description="Invoices, photos and proof of receipt downloaded through authorized API routes."
                >
                  {canUploadAttachment && (
                    <div className="mb-3">
                      <Input
                        type="file"
                        disabled={uploadMutation.isPending}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;

                          if (file.size > maxAttachmentUploadBytes) {
                            setUploadValidationError(
                              `File is ${formatBytes(file.size)}. Maximum allowed size is ${formatBytes(maxAttachmentUploadBytes)}.`,
                            );
                            event.target.value = "";
                            return;
                          }

                          setUploadValidationError(null);
                          setPendingUpload({ name: file.name, size: file.size });
                          uploadMutation.mutate(file);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Maximum file size {formatBytes(maxAttachmentUploadBytes)}. Uploads are
                        stored through the authorized backend attachment route.
                      </p>
                      {pendingUpload && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Uploading {pendingUpload.name} ({formatBytes(pendingUpload.size)})...
                        </p>
                      )}
                      {uploadValidationError && (
                        <p className="mt-2 text-sm text-[var(--destructive)]">
                          {uploadValidationError}
                        </p>
                      )}
                      {uploadMutation.isError && (
                        <p className="mt-2 text-sm text-[var(--destructive)]">
                          {uploadMutation.error instanceof Error
                            ? uploadMutation.error.message
                            : "Upload failed."}
                        </p>
                      )}
                    </div>
                  )}
                  <ul className="divide-y divide-border/60">
                    {detail.attachments.length === 0 && (
                      <li className="py-4 text-sm text-muted-foreground">
                        No attachments uploaded.
                      </li>
                    )}
                    {detail.attachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{textField(attachment, "filename")}</div>
                            <CopyableId value={attachment.id} label="Attachment ID" />
                          </div>
                          <div className="break-all text-xs text-muted-foreground">
                            {textField(attachment, "contentType")} ·{" "}
                            {formatBytes(attachment.contentLength)} · SHA-256{" "}
                            {textField(attachment, "checksumSha256")}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {canDownloadAttachment && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={downloadMutation.isPending}
                              onClick={() => downloadMutation.mutate(attachment)}
                            >
                              Download
                            </Button>
                          )}
                          {canDeleteAttachment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(attachment.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </TabsContent>

              <TabsContent value="qr">
                <Panel
                  title="QR label"
                  description="Printable asset label for warehouse, custody and audit scans."
                  bodyClassName="overflow-hidden p-4"
                  actions={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void printAssetQrLabel({
                          payload: qrPayload,
                          assetTag: textField(asset, "assetTag"),
                          name: textField(asset, "name"),
                          serialNumber: textField(asset, "serialNumber"),
                          location: locationLabel,
                        })
                      }
                    >
                      <QrCode className="size-4" />
                      Print QR
                    </Button>
                  }
                >
                  <div className="grid min-w-0 gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
                    <AssetQrCode payload={qrPayload} label={textField(asset, "assetTag")} />
                    <dl className="grid min-w-0 content-start gap-x-6 md:grid-cols-2">
                      <KeyValue label="Asset tag">{textField(asset, "assetTag")}</KeyValue>
                      <KeyValue label="Name">{textField(asset, "name")}</KeyValue>
                      <KeyValue label="Serial">{textField(asset, "serialNumber")}</KeyValue>
                      <KeyValue label="Location">
                        <AssetLocationValue asset={asset} lookups={assetLookups} />
                      </KeyValue>
                      <KeyValue label="Record ID">
                        <CopyableId value={asset.id} label="Asset record ID" />
                      </KeyValue>
                    </dl>
                  </div>
                </Panel>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <Panel title="At a glance">
                <dl>
                  <KeyValue label="Status">
                    <StatusBadge status={textField(asset, "status", "active")} />
                  </KeyValue>
                  <KeyValue label="Condition">
                    <StatusBadge status={textField(asset, "condition", "good")} />
                  </KeyValue>
                  <KeyValue label="Location">
                    <AssetLocationValue asset={asset} lookups={assetLookups} />
                  </KeyValue>
                  <KeyValue label="Custodian">
                    <CustodianValue users={assetLookups.users} id={asset.custodianUserId} />
                  </KeyValue>
                  <KeyValue label="Attachments">{detail.attachments.length}</KeyValue>
                </dl>
              </Panel>
              <Panel title="Technical details">
                <dl>
                  <KeyValue label="Record ID">
                    <CopyableId value={asset.id} label="Asset record ID" />
                  </KeyValue>
                  <KeyValue label="Type ref">
                    <CopyableId value={asset.assetTypeId} label="Asset type ID" />
                  </KeyValue>
                  <KeyValue label="Model ref">
                    <CopyableId value={asset.modelId} label="Model ID" />
                  </KeyValue>
                  <KeyValue label="Vendor ref">
                    <CopyableId value={asset.vendorId} label="Vendor ID" />
                  </KeyValue>
                </dl>
              </Panel>
              <Panel title="Quick actions" bodyClassName="p-3 flex flex-col gap-2">
                {canUseCustody && (
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link to="/custody">Check out or handover</Link>
                  </Button>
                )}
                {canUseMaintenance && (
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link to="/maintenance">Open maintenance ticket</Link>
                  </Button>
                )}
                {canUseAuditScan && (
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link to="/audit-reports">Use in audit scan</Link>
                  </Button>
                )}
                {!canUseCustody && !canUseMaintenance && !canUseAuditScan && (
                  <p className="text-sm text-muted-foreground">
                    No quick actions are available for your current role.
                  </p>
                )}
              </Panel>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} />
    </div>
  );
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

async function printAssetQrLabel(info: AssetQrPrintInfo) {
  const win = window.open("", "custivio-asset-qr", "width=480,height=640");
  if (!win) return;
  const qrDataUrl = await createQrDataUrl(info.payload, 192);
  win.document.write(buildAssetQrPrintHtml(info, qrDataUrl));
  win.document.close();
  win.focus();
  win.print();
}

async function loadAssetReferenceData({
  canReadCatalog,
  canReadLocations,
  canReadCustody,
  canReadUsers,
}: {
  canReadCatalog: boolean;
  canReadLocations: boolean;
  canReadCustody: boolean;
  canReadUsers: boolean;
}): Promise<AssetReferenceData> {
  const [
    types,
    models,
    vendors,
    customFields,
    sites,
    buildings,
    floors,
    rooms,
    racks,
    shelves,
    bins,
    usersResult,
  ] = await Promise.all([
    canReadCatalog ? listCatalogRecords("types") : Promise.resolve(undefined),
    canReadCatalog ? listCatalogRecords("models") : Promise.resolve(undefined),
    canReadCatalog ? listCatalogRecords("vendors") : Promise.resolve(undefined),
    canReadCatalog ? listCatalogRecords("custom-fields") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("sites") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("buildings") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("floors") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("rooms") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("racks") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("shelves") : Promise.resolve(undefined),
    canReadLocations ? listLocationRecords("bins") : Promise.resolve(undefined),
    canReadCustody ? getCustodyOverview() : canReadUsers ? listUsers() : Promise.resolve(undefined),
  ]);

  return {
    types: types ? unwrapApiResult(types).records : [],
    models: models ? unwrapApiResult(models).records : [],
    vendors: vendors ? unwrapApiResult(vendors).records : [],
    customFields: customFields ? unwrapApiResult(customFields).records : [],
    sites: sites ? unwrapApiResult(sites).records : [],
    buildings: buildings ? unwrapApiResult(buildings).records : [],
    floors: floors ? unwrapApiResult(floors).records : [],
    rooms: rooms ? unwrapApiResult(rooms).records : [],
    racks: racks ? unwrapApiResult(racks).records : [],
    shelves: shelves ? unwrapApiResult(shelves).records : [],
    bins: bins ? unwrapApiResult(bins).records : [],
    users: usersResult ? unwrapApiResult(usersResult).users : [],
  };
}
