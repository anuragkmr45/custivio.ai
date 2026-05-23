import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetRecord } from "@/lib/api/assets";
import { textField, type ApiRecord } from "@/lib/api/records";
import {
  customFieldsForAssetType,
  filterByParent,
  locationOption,
  recordOption,
  type AssetReferenceData,
  type SelectOption,
  uniqueOptions,
  userOption,
} from "@/lib/asset-display";
import { cn } from "@/lib/utils";

export function AssetFormFields({
  referenceData,
  asset,
  mode,
}: {
  referenceData: AssetReferenceData;
  asset?: AssetRecord;
  mode: "create" | "edit";
}) {
  const defaultAssetTypeId = textField(
    asset,
    "assetTypeId",
    String(referenceData.types[0]?.id ?? ""),
  );
  const [assetTypeId, setAssetTypeId] = useState(defaultAssetTypeId);
  const [siteId, setSiteId] = useState(textField(asset, "siteId", ""));
  const [buildingId, setBuildingId] = useState(textField(asset, "buildingId", ""));
  const [floorId, setFloorId] = useState(textField(asset, "floorId", ""));
  const [roomId, setRoomId] = useState(textField(asset, "roomId", ""));
  const [rackId, setRackId] = useState(textField(asset, "rackId", ""));
  const [shelfId, setShelfId] = useState(textField(asset, "shelfId", ""));

  useEffect(() => {
    if (!assetTypeId && defaultAssetTypeId) setAssetTypeId(defaultAssetTypeId);
  }, [assetTypeId, defaultAssetTypeId]);

  const filteredBuildings = useMemo(
    () => filterByParent(referenceData.buildings, "siteId", siteId, buildingId),
    [buildingId, referenceData.buildings, siteId],
  );
  const filteredFloors = useMemo(
    () => filterByParent(referenceData.floors, "buildingId", buildingId, floorId),
    [buildingId, floorId, referenceData.floors],
  );
  const filteredRooms = useMemo(
    () => filterByParent(referenceData.rooms, "floorId", floorId, roomId),
    [floorId, referenceData.rooms, roomId],
  );
  const filteredRacks = useMemo(
    () => filterByParent(referenceData.racks, "roomId", roomId, rackId),
    [rackId, referenceData.racks, roomId],
  );
  const filteredShelves = useMemo(
    () => filterByParent(referenceData.shelves, "rackId", rackId, shelfId),
    [rackId, referenceData.shelves, shelfId],
  );
  const filteredBins = useMemo(() => {
    if (shelfId) return filterByParent(referenceData.bins, "shelfId", shelfId);
    if (roomId) return filterByParent(referenceData.bins, "roomId", roomId);

    return referenceData.bins;
  }, [referenceData.bins, roomId, shelfId]);

  const customFields = customFieldsForAssetType(referenceData.customFields, assetTypeId);

  return (
    <div className="grid gap-4 overflow-x-hidden">
      <Section
        title="Identity"
        description="Asset tag is the readable label used on barcodes, QR labels, search and reports."
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {mode === "create" ? (
            <Field name="assetTag" label="Asset tag" required />
          ) : (
            <ReadOnlyField label="Asset tag" value={textField(asset, "assetTag")} mono />
          )}
          <Field name="name" label="Name" defaultValue={textField(asset, "name", "")} required />
          <Field
            name="serialNumber"
            label="Serial number"
            defaultValue={textField(asset, "serialNumber", "")}
          />
        </div>
      </Section>

      <Section title="Catalog" description="Choose the master data record instead of pasting IDs.">
        <div className="grid gap-3 lg:grid-cols-3">
          <SelectField
            name="assetTypeId"
            label="Asset type"
            value={assetTypeId}
            required
            onChange={setAssetTypeId}
            options={uniqueOptions(referenceData.types.map(recordOption))}
          />
          <SelectField
            name="modelId"
            label="Model"
            optional
            defaultValue={textField(asset, "modelId", "")}
            options={uniqueOptions(referenceData.models.map(recordOption))}
          />
          <SelectField
            name="vendorId"
            label="Vendor"
            optional
            defaultValue={textField(asset, "vendorId", "")}
            options={uniqueOptions(referenceData.vendors.map(recordOption))}
          />
        </div>
      </Section>

      <Section title="Status and ownership">
        <div className="grid gap-3 lg:grid-cols-3">
          <SelectField
            name="status"
            label="Status"
            defaultValue={textField(asset, "status", "in_stock")}
            options={[
              { value: "in_stock", label: "In stock" },
              { value: "in_use", label: "In use" },
              { value: "maintenance", label: "Maintenance" },
              { value: "retired", label: "Retired" },
            ]}
          />
          <SelectField
            name="condition"
            label="Condition"
            defaultValue={textField(asset, "condition", "good")}
            options={[
              { value: "new", label: "New" },
              { value: "good", label: "Good" },
              { value: "fair", label: "Fair" },
              { value: "repair_needed", label: "Repair needed" },
              { value: "retired", label: "Retired" },
            ]}
          />
          <SelectField
            name="custodianUserId"
            label="Custodian"
            optional
            defaultValue={textField(asset, "custodianUserId", "")}
            options={uniqueOptions(referenceData.users.map(userOption))}
          />
        </div>
      </Section>

      <Section title="Location" description="Child dropdowns narrow after a parent is selected.">
        <div className="grid gap-3 lg:grid-cols-4">
          <SelectField
            name="siteId"
            label="Site"
            optional
            value={siteId}
            onChange={(value) => {
              setSiteId(value);
              setBuildingId("");
              setFloorId("");
              setRoomId("");
              setRackId("");
              setShelfId("");
            }}
            options={uniqueOptions(referenceData.sites.map(locationOption))}
          />
          <SelectField
            name="buildingId"
            label="Building"
            optional
            value={buildingId}
            onChange={(value) => {
              setBuildingId(value);
              setFloorId("");
              setRoomId("");
              setRackId("");
              setShelfId("");
            }}
            options={uniqueOptions(filteredBuildings.map(locationOption))}
          />
          <SelectField
            name="floorId"
            label="Floor"
            optional
            value={floorId}
            onChange={(value) => {
              setFloorId(value);
              setRoomId("");
              setRackId("");
              setShelfId("");
            }}
            options={uniqueOptions(filteredFloors.map(locationOption))}
          />
          <SelectField
            name="roomId"
            label="Room"
            optional
            value={roomId}
            onChange={(value) => {
              setRoomId(value);
              setRackId("");
              setShelfId("");
            }}
            options={uniqueOptions(filteredRooms.map(locationOption))}
          />
          <SelectField
            name="rackId"
            label="Rack"
            optional
            value={rackId}
            onChange={(value) => {
              setRackId(value);
              setShelfId("");
            }}
            options={uniqueOptions(filteredRacks.map(locationOption))}
          />
          <SelectField
            name="shelfId"
            label="Shelf"
            optional
            value={shelfId}
            onChange={setShelfId}
            options={uniqueOptions(filteredShelves.map(locationOption))}
          />
          <SelectField
            name="binId"
            label="Bin"
            optional
            defaultValue={textField(asset, "binId", "")}
            options={uniqueOptions(filteredBins.map(locationOption))}
          />
        </div>
      </Section>

      <CustomFieldInputs fields={customFields} values={asset?.customFields ?? {}} />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-md border border-border bg-surface-1/30 p-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} type={type} />
    </div>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label>{label}</Label>
      <div
        className={cn(
          "flex min-h-10 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  optional,
  required,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  options: SelectOption[];
  optional?: boolean;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        required={required || !optional}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
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

function CustomFieldInputs({
  fields,
  values,
}: {
  fields: ApiRecord[];
  values: Record<string, unknown>;
}) {
  if (fields.length === 0) return null;

  return (
    <Section
      title="Custom fields"
      description="Custom fields are admin-configured details for this asset type."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {fields.map((field) => {
          const key = textField(field, "key", "");
          const label = textField(field, "label", key);
          const fieldType = textField(field, "fieldType", "text");
          const required = String(field.required ?? "false") === "true";
          const choices = getFieldChoices(field);
          const value = values[key];

          if (!key) return null;

          if (fieldType === "boolean") {
            return (
              <label key={field.id} className="flex items-center gap-2 self-end text-sm">
                <input name={`custom.${key}`} type="checkbox" defaultChecked={value === true} />
                {label}
              </label>
            );
          }

          if (fieldType === "multiselect" && choices.length > 0) {
            const selected = Array.isArray(value) ? value.map(String) : [];

            return (
              <div key={field.id} className="grid min-w-0 gap-1.5">
                <Label htmlFor={`custom.${key}`}>{label}</Label>
                <select
                  id={`custom.${key}`}
                  name={`custom.${key}`}
                  multiple
                  defaultValue={selected}
                  required={required}
                  className="min-h-24 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {choices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (fieldType === "select" && choices.length > 0) {
            return (
              <SelectField
                key={field.id}
                name={`custom.${key}`}
                label={label}
                optional={!required}
                defaultValue={stringValue(value)}
                options={choices}
              />
            );
          }

          return (
            <Field
              key={field.id}
              name={`custom.${key}`}
              label={label}
              defaultValue={stringValue(value)}
              type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : "text"}
              required={required}
            />
          );
        })}
      </div>
    </Section>
  );
}

function getFieldChoices(field: ApiRecord): SelectOption[] {
  const options = field.options;
  if (!options || typeof options !== "object" || Array.isArray(options)) return [];
  const choices = (options as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return [];

  return uniqueOptions(
    choices
      .map((choice): SelectOption | null => {
        if (typeof choice === "string") return { value: choice, label: choice };
        if (!choice || typeof choice !== "object" || Array.isArray(choice)) return null;

        const value = textField(choice as Record<string, unknown>, "value", "");
        const label = textField(choice as Record<string, unknown>, "label", value);

        return value ? { value, label } : null;
      })
      .filter((choice): choice is SelectOption => Boolean(choice)),
  );
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  return "";
}
