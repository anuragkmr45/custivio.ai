import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import {
  AssetLocationValue,
  CustodianValue,
  RelatedRecordValue,
} from "@/components/data/AssetReferenceValue";
import { CopyableId } from "@/components/data/CopyableId";
import { PageHeader, PageBody } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import { AssetFormFields } from "@/components/assets/AssetFormFields";
import { createAsset, listAssets, type AssetRecord } from "@/lib/api/assets";
import { listUsers } from "@/lib/api/admin";
import { listCatalogRecords } from "@/lib/api/catalog";
import { getCustodyOverview } from "@/lib/api/custody";
import { listLocationRecords } from "@/lib/api/locations";
import { textField } from "@/lib/api/records";
import { unwrapApiResult } from "@/lib/api/errors";
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

export const Route = createFileRoute("/_authenticated/assets/")({
  head: () => ({
    meta: [
      { title: "Asset Registry - Custivio" },
      {
        name: "description",
        content: "Tenant-wide asset registry: tags, serials, custody, status.",
      },
    ],
  }),
  component: AssetsPage,
});

const assetsQueryKey = ["assets", "list"] as const;
const assetPageSize = 25;

function AssetsPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canViewAssets = canAccess(session, ROUTE_ACCESS.assets);
  const canReadCatalog = canAccess(session, ROUTE_ACCESS.catalog);
  const canReadLocations = canAccess(session, ACTION_ACCESS.locationManage);
  const canCreateAssets = canAccess(session, ACTION_ACCESS.assetCreate) && canReadCatalog;
  const canReadCustody = canAccess(session, ROUTE_ACCESS.custody);
  const canReadUsers = canAccess(session, ROUTE_ACCESS.users);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetOffset, setAssetOffset] = useState(0);
  const debouncedAssetSearch = useDebouncedValue(assetSearch, 350);

  useEffect(() => {
    setAssetOffset(0);
  }, [debouncedAssetSearch]);

  const assetsQuery = useQuery({
    queryKey: [...assetsQueryKey, debouncedAssetSearch, assetOffset],
    queryFn: async () =>
      unwrapApiResult(
        await listAssets({
          q: debouncedAssetSearch || undefined,
          limit: assetPageSize,
          offset: assetOffset,
        }),
      ),
    enabled: canViewAssets,
  });

  const assetReferenceQuery = useQuery({
    queryKey: [
      "assets",
      "reference-data",
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
    enabled:
      canViewAssets && (canReadCatalog || canReadLocations || canReadCustody || canReadUsers),
  });

  const assetReferenceData = assetReferenceQuery.data ?? emptyAssetReferenceData;
  const assetLookups = useMemo(
    () => buildAssetReferenceLookups(assetReferenceData),
    [assetReferenceData],
  );

  const createMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCreateError(null);
      return unwrapApiResult(
        await createAsset({
          assetTypeId: String(form.get("assetTypeId") ?? ""),
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
          assetTag: String(form.get("assetTag") ?? ""),
          serialNumber: String(form.get("serialNumber") ?? "") || undefined,
          name: String(form.get("name") ?? ""),
          status: String(form.get("status") ?? "in_stock") || "in_stock",
          condition: String(form.get("condition") ?? "good") || "good",
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
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: assetsQueryKey });
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Could not register asset.");
    },
  });

  const cols: Column<AssetRecord>[] = [
    {
      key: "asset",
      header: "Asset",
      sortable: true,
      sortValue: (r) => textField(r, "assetTag"),
      searchValue: (r) =>
        [
          textField(r, "assetTag", ""),
          textField(r, "name", ""),
          textField(r, "serialNumber", ""),
          formatRelatedRecord(assetLookups.types, r.assetTypeId, ""),
          formatRelatedRecord(assetLookups.models, r.modelId, ""),
        ].join(" "),
      cell: (r) => (
        <div className="min-w-0">
          <Link
            to="/assets/$assetId"
            params={{ assetId: r.id }}
            className="font-mono text-sm font-semibold text-accent hover:underline"
          >
            {textField(r, "assetTag")}
          </Link>
          <div className="mt-0.5 truncate font-medium text-foreground">{textField(r, "name")}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Serial {textField(r, "serialNumber")}
          </div>
        </div>
      ),
    },
    {
      key: "catalog",
      header: "Catalog",
      sortable: true,
      sortValue: (r) => formatRelatedRecord(assetLookups.types, r.assetTypeId, ""),
      searchValue: (r) =>
        [
          formatRelatedRecord(assetLookups.types, r.assetTypeId, ""),
          formatRelatedRecord(assetLookups.models, r.modelId, ""),
          formatRelatedRecord(assetLookups.vendors, r.vendorId, ""),
        ].join(" "),
      cell: (r) => (
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium text-foreground">
            <RelatedRecordValue map={assetLookups.types} id={r.assetTypeId} label="Asset type ID" />
          </div>
          <div className="truncate text-xs text-muted-foreground">
            <RelatedRecordValue
              map={assetLookups.models}
              id={r.modelId}
              label="Model ID"
              fallback="No model"
            />
          </div>
          <div className="truncate text-xs text-muted-foreground">
            <RelatedRecordValue
              map={assetLookups.vendors}
              id={r.vendorId}
              label="Vendor ID"
              fallback="No vendor"
            />
          </div>
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      sortable: true,
      sortValue: (r) => textField(r, "status"),
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={textField(r, "status", "active")} />
          <StatusBadge status={textField(r, "condition", "good")} />
        </div>
      ),
    },
    {
      key: "custodian",
      header: "Custodian",
      sortable: true,
      sortValue: (r) => formatCustodian(assetLookups, r.custodianUserId, ""),
      cell: (r) => <CustodianValue users={assetLookups.users} id={r.custodianUserId} />,
      searchValue: (r) => formatCustodian(assetLookups, r.custodianUserId, ""),
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      sortValue: (r) => formatAssetLocation(r, assetLookups),
      cell: (r) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          <AssetLocationValue asset={r} lookups={assetLookups} />
        </span>
      ),
      searchValue: (r) => formatAssetLocation(r, assetLookups),
    },
    {
      key: "ref",
      header: "Ref",
      cell: (r) => <CopyableId value={r.id} label="Asset record ID" />,
      searchValue: (r) => r.id,
    },
  ];

  if (!canViewAssets) {
    return (
      <>
        <PageHeader
          title="Asset Registry"
          description="Tenant-wide asset registry: tags, serials, custody, status."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot view the asset registry."
            required={formatPermissionRequirement(ROUTE_ACCESS.assets)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Asset Registry"
        description={`${assetsQuery.data?.pageInfo?.total ?? assetsQuery.data?.assets.length ?? 0} registered assets from the backend.`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/audit-reports">
                <Download className="size-4" />
                Exports
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/audit-reports">
                <QrCode className="size-4" />
                Audit scan
              </Link>
            </Button>
            {canCreateAssets && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Register asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
                  <form
                    action={(formData) => createMutation.mutate(formData)}
                    className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden"
                  >
                    <DialogHeader className="px-6 pt-6">
                      <DialogTitle>Register asset</DialogTitle>
                      <DialogDescription>
                        Create a readable asset record with catalog, location and ownership data.
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
                      <AssetFormFields referenceData={assetReferenceData} mode="create" />
                      {createError && (
                        <p className="text-sm text-[var(--destructive)]">{createError}</p>
                      )}
                    </div>
                    <DialogFooter className="border-t border-border bg-background px-6 py-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          createMutation.isPending ||
                          assetReferenceQuery.isLoading ||
                          assetReferenceData.types.length === 0
                        }
                      >
                        Register
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
        {assetsQuery.isLoading && <LoadingPanel label="Loading assets..." />}
        {assetsQuery.isError && (
          <ApiErrorPanel error={assetsQuery.error} onRetry={() => assetsQuery.refetch()} />
        )}
        {assetsQuery.data && (
          <DataTable
            rows={assetsQuery.data.assets}
            columns={cols}
            searchPlaceholder="Search by tag, serial, name, model, custodian..."
            searchValue={assetSearch}
            onSearchChange={setAssetSearch}
            pagination={{
              total: assetsQuery.data.pageInfo?.total ?? assetsQuery.data.assets.length,
              limit: assetsQuery.data.pageInfo?.limit ?? assetPageSize,
              offset: assetsQuery.data.pageInfo?.offset ?? assetOffset,
              isLoading: assetsQuery.isFetching,
            }}
            onPageChange={setAssetOffset}
            initialSort={{ key: "asset", dir: "asc" }}
          />
        )}
      </PageBody>
    </>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
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
