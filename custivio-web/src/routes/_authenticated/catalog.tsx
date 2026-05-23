import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Plus } from "lucide-react";
import { useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import {
  archiveCatalogRecord,
  createCatalogRecord,
  listCatalogRecords,
  updateCatalogRecord,
  type CatalogRecord,
} from "@/lib/api/catalog";
import {
  archiveLocationRecord,
  createLocationRecord,
  listLocationRecords,
  updateLocationRecord,
} from "@/lib/api/locations";
import {
  catalogResources,
  locationResources,
  textField,
  type ApiRecord,
  type CatalogResource,
  type LocationResource,
} from "@/lib/api/records";
import { unwrapApiResult } from "@/lib/api/errors";
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

export const Route = createFileRoute("/_authenticated/catalog")({
  head: () => ({
    meta: [
      { title: "Asset Catalog - Custivio" },
      {
        name: "description",
        content: "Categories, types, custom fields, manufacturers, models, vendors and locations.",
      },
    ],
  }),
  component: CatalogPage,
});

const catalogQueryKey = ["catalog", "overview"] as const;
const locationQueryKey = ["locations", "overview"] as const;

type CatalogOverview = Record<CatalogResource, CatalogRecord[]>;
type LocationOverview = Record<LocationResource, ApiRecord[]>;

function CatalogPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canManageCatalog = canAccess(session, ROUTE_ACCESS.catalog);
  const canManageLocations = canAccess(session, ACTION_ACCESS.locationManage);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [catalogEdit, setCatalogEdit] = useState<{
    resource: CatalogResource;
    record: CatalogRecord;
  } | null>(null);
  const [locationEdit, setLocationEdit] = useState<{
    resource: LocationResource;
    record: ApiRecord;
  } | null>(null);
  const [catalogResource, setCatalogResource] = useState<CatalogResource>("categories");
  const [locationResource, setLocationResource] = useState<LocationResource>("sites");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [catalogEditError, setCatalogEditError] = useState<string | null>(null);
  const [locationEditError, setLocationEditError] = useState<string | null>(null);
  const catalogQuery = useQuery({
    queryKey: catalogQueryKey,
    queryFn: async (): Promise<CatalogOverview> => {
      const entries = await Promise.all(
        catalogResources.map(async (resource) => {
          const records = unwrapApiResult(await listCatalogRecords(resource)).records;
          return [resource, records] as const;
        }),
      );

      return Object.fromEntries(entries) as CatalogOverview;
    },
    enabled: canManageCatalog,
  });

  const locationQuery = useQuery({
    queryKey: locationQueryKey,
    queryFn: async (): Promise<LocationOverview> => {
      const entries = await Promise.all(
        locationResources.map(async (resource) => {
          const records = unwrapApiResult(await listLocationRecords(resource)).records;
          return [resource, records] as const;
        }),
      );

      return Object.fromEntries(entries) as LocationOverview;
    },
    enabled: canManageLocations,
  });

  const archiveCatalogMutation = useMutation({
    mutationFn: async ({ resource, id }: { resource: CatalogResource; id: string }) =>
      unwrapApiResult(await archiveCatalogRecord(resource, id)).record,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogQueryKey }),
  });

  const archiveLocationMutation = useMutation({
    mutationFn: async ({ resource, id }: { resource: LocationResource; id: string }) =>
      unwrapApiResult(await archiveLocationRecord(resource, id)).record,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationQueryKey }),
  });

  const updateCatalogMutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!catalogEdit) throw new Error("No catalog record selected.");
      setCatalogEditError(null);
      return unwrapApiResult(
        await updateCatalogRecord(catalogEdit.resource, catalogEdit.record.id, {
          [catalogEdit.resource === "custom-fields" ? "label" : "name"]: String(
            form.get("displayName") ?? "",
          ).trim(),
        }),
      ).record;
    },
    onSuccess: async () => {
      setCatalogEdit(null);
      await queryClient.invalidateQueries({ queryKey: catalogQueryKey });
    },
    onError: (error) =>
      setCatalogEditError(error instanceof Error ? error.message : "Could not update record."),
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!locationEdit) throw new Error("No location selected.");
      setLocationEditError(null);
      return unwrapApiResult(
        await updateLocationRecord(locationEdit.resource, locationEdit.record.id, {
          name: String(form.get("name") ?? "").trim(),
        }),
      ).record;
    },
    onSuccess: async () => {
      setLocationEdit(null);
      await queryClient.invalidateQueries({ queryKey: locationQueryKey });
    },
    onError: (error) =>
      setLocationEditError(error instanceof Error ? error.message : "Could not update location."),
  });

  const createCatalogMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCatalogError(null);
      return unwrapApiResult(
        await createCatalogRecord(
          catalogResource,
          buildCatalogCreateBody(catalogResource, form, catalogQuery.data),
        ),
      ).record;
    },
    onSuccess: async () => {
      setCatalogDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: catalogQueryKey });
    },
    onError: (error) =>
      setCatalogError(error instanceof Error ? error.message : "Could not create catalog record."),
  });

  const createLocationMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setLocationError(null);
      return unwrapApiResult(
        await createLocationRecord(
          locationResource,
          buildLocationCreateBody(locationResource, form, locationQuery.data),
        ),
      ).record;
    },
    onSuccess: async () => {
      setLocationDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: locationQueryKey });
    },
    onError: (error) =>
      setLocationError(error instanceof Error ? error.message : "Could not create location."),
  });

  if (!canManageCatalog) {
    return (
      <>
        <PageHeader
          title="Asset Catalog"
          description="Categories, types, custom fields, manufacturers, models, vendors and locations."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot manage catalog master data."
            required={formatPermissionRequirement(ROUTE_ACCESS.catalog)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Asset Catalog"
        description="Live backend master data for categories, types, custom fields, suppliers and location hierarchy."
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" />
                  New catalog record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form
                  action={(formData) => createCatalogMutation.mutate(formData)}
                  className="space-y-4"
                >
                  <DialogHeader>
                    <DialogTitle>Create catalog record</DialogTitle>
                    <DialogDescription>
                      Adds backend master data used by assets, stock and reporting.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <SelectField
                      label="Resource"
                      value={catalogResource}
                      onChange={(value) => setCatalogResource(value as CatalogResource)}
                      options={catalogResources.map((resource) => ({
                        value: resource,
                        label: resource,
                      }))}
                    />
                    <Field name="key" label="Key" required />
                    <Field
                      name={catalogResource === "custom-fields" ? "label" : "name"}
                      label={catalogResource === "custom-fields" ? "Label" : "Name"}
                      required
                    />
                    <CatalogDependencyFields
                      resource={catalogResource}
                      overview={catalogQuery.data}
                    />
                    <Field name="description" label="Description" />
                    {catalogError && (
                      <p className="text-sm text-[var(--destructive)]">{catalogError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCatalogDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCatalogMutation.isPending}>
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {canManageLocations && (
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="size-4" />
                    New location
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => createLocationMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Create location</DialogTitle>
                      <DialogDescription>
                        Adds one level of the physical location hierarchy.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        label="Resource"
                        value={locationResource}
                        onChange={(value) => setLocationResource(value as LocationResource)}
                        options={locationResources.map((resource) => ({
                          value: resource,
                          label: resource,
                        }))}
                      />
                      <Field name="code" label="Code" required />
                      <Field name="name" label="Name" required />
                      <LocationDependencyFields
                        resource={locationResource}
                        overview={locationQuery.data}
                      />
                      {locationError && (
                        <p className="text-sm text-[var(--destructive)]">{locationError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocationDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLocationMutation.isPending}>
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />
      <PageBody>
        {catalogQuery.isLoading && <LoadingPanel label="Loading catalog records..." />}
        {catalogQuery.isError && (
          <ApiErrorPanel error={catalogQuery.error} onRetry={() => catalogQuery.refetch()} />
        )}
        {catalogQuery.data && (
          <Tabs defaultValue="categories">
            <TabsList>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="types">Asset types</TabsTrigger>
              <TabsTrigger value="custom-fields">Custom fields</TabsTrigger>
              <TabsTrigger value="manufacturers">Manufacturers</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>
            {catalogResources.map((resource) => (
              <TabsContent key={resource} value={resource}>
                <RecordTable
                  records={catalogQuery.data[resource]}
                  onUpdate={(record) => {
                    setCatalogEditError(null);
                    setCatalogEdit({ resource, record });
                  }}
                  onArchive={(id) => archiveCatalogMutation.mutate({ resource, id })}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {canManageLocations && (
          <Panel
            title="Location hierarchy"
            description="Backend location records used by asset and stock workflows."
            bodyClassName="p-0"
          >
            {locationQuery.isLoading && (
              <div className="p-4">
                <LoadingPanel label="Loading locations..." />
              </div>
            )}
            {locationQuery.isError && (
              <div className="p-4">
                <ApiErrorPanel
                  error={locationQuery.error}
                  onRetry={() => locationQuery.refetch()}
                />
              </div>
            )}
            {locationQuery.data && (
              <div className="p-4">
                <Tabs defaultValue="sites">
                  <TabsList>
                    {locationResources.map((resource) => (
                      <TabsTrigger key={resource} value={resource}>
                        {resource}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {locationResources.map((resource) => (
                    <TabsContent key={resource} value={resource}>
                      <RecordTable
                        records={locationQuery.data[resource]}
                        onUpdate={(record) => {
                          setLocationEditError(null);
                          setLocationEdit({ resource, record });
                        }}
                        onArchive={(id) => archiveLocationMutation.mutate({ resource, id })}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </Panel>
        )}
        <Dialog
          open={Boolean(catalogEdit)}
          onOpenChange={(open) => {
            if (!open) setCatalogEdit(null);
          }}
        >
          <DialogContent>
            <form
              action={(formData) => updateCatalogMutation.mutate(formData)}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Edit catalog record</DialogTitle>
                <DialogDescription>
                  Updates the backend display value for this record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field
                  name="displayName"
                  label={catalogEdit?.resource === "custom-fields" ? "Label" : "Name"}
                  defaultValue={textField(catalogEdit?.record, ["name", "label"], "")}
                  required
                />
                {catalogEditError && (
                  <p className="text-sm text-[var(--destructive)]">{catalogEditError}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCatalogEdit(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCatalogMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(locationEdit)}
          onOpenChange={(open) => {
            if (!open) setLocationEdit(null);
          }}
        >
          <DialogContent>
            <form
              action={(formData) => updateLocationMutation.mutate(formData)}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Edit location</DialogTitle>
                <DialogDescription>Updates the backend location display name.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field
                  name="name"
                  label="Name"
                  defaultValue={textField(locationEdit?.record, "name", "")}
                  required
                />
                {locationEditError && (
                  <p className="text-sm text-[var(--destructive)]">{locationEditError}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLocationEdit(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLocationMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageBody>
    </>
  );
}

function buildCatalogCreateBody(
  resource: CatalogResource,
  form: FormData,
  overview: CatalogOverview | undefined,
): Record<string, unknown> {
  const key = String(form.get("key") ?? "")
    .trim()
    .toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const label = String(form.get("label") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const body: Record<string, unknown> = {};

  if (resource !== "manufacturers" && resource !== "models" && resource !== "vendors") {
    body.key = key;
  }
  if (resource === "custom-fields") {
    body.label = label;
    body.assetTypeId =
      String(form.get("assetTypeId") ?? "") || overview?.types?.[0]?.id || undefined;
    body.fieldType = String(form.get("fieldType") ?? "text");
    body.required = form.get("required") === "on";
  } else {
    body.name = name;
  }
  if (description) body.description = description;
  if (resource === "types") {
    body.categoryId =
      String(form.get("categoryId") ?? "") || overview?.categories?.[0]?.id || undefined;
    body.trackingMode = String(form.get("trackingMode") ?? "asset");
  }
  if (resource === "models") {
    const manufacturerId = String(form.get("manufacturerId") ?? "");
    if (manufacturerId) body.manufacturerId = manufacturerId;
    const modelNumber = String(form.get("modelNumber") ?? "");
    if (modelNumber) body.modelNumber = modelNumber;
  }

  return body;
}

function buildLocationCreateBody(
  resource: LocationResource,
  form: FormData,
  overview: LocationOverview | undefined,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    code: String(form.get("code") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
  };
  const parentField = locationParentField(resource);
  const parentResource = locationParentResource(resource);

  if (parentField && parentResource) {
    body[parentField] =
      String(form.get(parentField) ?? "") || overview?.[parentResource]?.[0]?.id || undefined;
  }

  return body;
}

function CatalogDependencyFields({
  resource,
  overview,
}: {
  resource: CatalogResource;
  overview: CatalogOverview | undefined;
}) {
  if (resource === "types") {
    return (
      <>
        <SelectField
          name="categoryId"
          label="Category"
          options={(overview?.categories ?? []).map((record) => ({
            value: record.id,
            label: textField(record, "name"),
          }))}
        />
        <SelectField
          name="trackingMode"
          label="Tracking mode"
          defaultValue="asset"
          options={["asset", "stock", "license", "component"].map((value) => ({
            value,
            label: value,
          }))}
        />
      </>
    );
  }

  if (resource === "custom-fields") {
    return (
      <>
        <SelectField
          name="assetTypeId"
          label="Asset type"
          options={(overview?.types ?? []).map((record) => ({
            value: record.id,
            label: textField(record, "name"),
          }))}
        />
        <SelectField
          name="fieldType"
          label="Field type"
          defaultValue="text"
          options={["text", "number", "date", "boolean"].map((value) => ({ value, label: value }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input name="required" type="checkbox" />
          Required field
        </label>
      </>
    );
  }

  if (resource === "models") {
    return (
      <>
        <SelectField
          name="manufacturerId"
          label="Manufacturer"
          options={(overview?.manufacturers ?? []).map((record) => ({
            value: record.id,
            label: textField(record, "name"),
          }))}
        />
        <Field name="modelNumber" label="Model number" />
      </>
    );
  }

  return null;
}

function LocationDependencyFields({
  resource,
  overview,
}: {
  resource: LocationResource;
  overview: LocationOverview | undefined;
}) {
  const parentField = locationParentField(resource);
  const parentResource = locationParentResource(resource);

  if (!parentField || !parentResource) return null;

  return (
    <SelectField
      name={parentField}
      label={`Parent ${parentResource.slice(0, -1)}`}
      options={(overview?.[parentResource] ?? []).map((record) => ({
        value: record.id,
        label: `${textField(record, "code")} - ${textField(record, "name")}`,
      }))}
    />
  );
}

function locationParentField(resource: LocationResource): string | null {
  if (resource === "buildings") return "siteId";
  if (resource === "floors") return "buildingId";
  if (resource === "rooms") return "floorId";
  if (resource === "racks") return "roomId";
  if (resource === "shelves") return "rackId";
  if (resource === "bins") return "shelfId";
  return null;
}

function locationParentResource(resource: LocationResource): LocationResource | null {
  if (resource === "buildings") return "sites";
  if (resource === "floors") return "buildings";
  if (resource === "rooms") return "floors";
  if (resource === "racks") return "rooms";
  if (resource === "shelves") return "racks";
  if (resource === "bins") return "shelves";
  return null;
}

function Field({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} defaultValue={defaultValue} />
    </div>
  );
}

function SelectField({
  name,
  label,
  value,
  defaultValue,
  onChange,
  options,
}: {
  name?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RecordTable({
  records,
  onUpdate,
  onArchive,
}: {
  records: ApiRecord[];
  onUpdate: (record: ApiRecord) => void;
  onArchive: (id: string) => void;
}) {
  const columns: Column<ApiRecord>[] = [
    {
      key: "key",
      header: "Key/code",
      searchValue: (r) => textField(r, ["key", "code", "modelNumber", "sku"], ""),
      cell: (r) => (
        <span className="font-mono text-xs">
          {textField(r, ["key", "code", "modelNumber", "sku"], "-")}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => textField(r, ["name", "label"]),
      searchValue: (r) => textField(r, ["name", "label", "description"], ""),
      cell: (r) => <span className="font-medium">{textField(r, ["name", "label"])}</span>,
    },
    {
      key: "details",
      header: "Details",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {textField(r, ["trackingMode", "fieldType", "contactEmail", "description"], "-")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "active")} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onUpdate(r)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={textField(r, "status", "active") === "archived"}
            onClick={() => onArchive(r.id)}
          >
            <Archive className="size-4" />
            Archive
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      rows={records}
      columns={columns}
      searchPlaceholder="Search master data..."
      initialSort={{ key: "name", dir: "asc" }}
    />
  );
}
