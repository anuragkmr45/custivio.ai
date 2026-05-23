import { requirePermission } from "@custivio/auth";
import {
  appendAuditLog,
  countAssetsByAssetType,
  countAssetTypesByCategory,
  createAssetCategory,
  createAssetModel,
  createAssetType,
  createCustomFieldDefinition,
  createManufacturer,
  createVendor,
  listAssetCategoriesByTenant,
  listAssetModelsByTenant,
  listAssetTypesByTenant,
  listCustomFieldDefinitionsByTenant,
  listManufacturersByTenant,
  listVendorsByTenant,
  updateAssetCategory,
  updateAssetModel,
  updateAssetType,
  updateCustomFieldDefinition,
  updateManufacturer,
  updateVendor,
  type AssetCategory,
  type AssetModel,
  type AssetType,
  type CustomFieldDefinition,
  type Manufacturer,
  type Vendor,
} from "@custivio/db";

import { CatalogError } from "./errors";

export const catalogResources = [
  "categories",
  "types",
  "custom-fields",
  "manufacturers",
  "models",
  "vendors",
] as const;

export type CatalogResource = (typeof catalogResources)[number];

export interface CatalogOverview {
  categories: AssetCategory[];
  types: AssetType[];
  customFields: CustomFieldDefinition[];
  manufacturers: Manufacturer[];
  models: AssetModel[];
  vendors: Vendor[];
}

type CatalogRecord =
  | AssetCategory
  | AssetType
  | CustomFieldDefinition
  | Manufacturer
  | AssetModel
  | Vendor;

const allowedFieldTypes = ["text", "number", "date", "boolean", "select", "multiselect"] as const;
const allowedTrackingModes = ["asset", "stock", "license", "component"] as const;

function isCatalogResource(resource: string): resource is CatalogResource {
  return catalogResources.some((item) => item === resource);
}

function requireCatalogResource(resource: string): CatalogResource {
  if (!isCatalogResource(resource)) {
    throw new CatalogError("unknown_catalog_resource", "Unknown catalog resource.", 404);
  }

  return resource;
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
    throw new CatalogError("invalid_catalog_input", `${key} is required.`, 400);
  }

  return value;
}

function requireKey(input: Record<string, unknown>): string {
  const key = requireString(input, "key").toLowerCase();

  if (!/^[a-z0-9][a-z0-9_-]{1,78}$/.test(key)) {
    throw new CatalogError(
      "invalid_catalog_input",
      "key must use lowercase letters, numbers, underscores, or hyphens.",
      400,
    );
  }

  return key;
}

function requireAllowedValue<const T extends readonly string[]>(
  value: string,
  allowed: T,
  fieldName: string,
): T[number] {
  if (!allowed.some((item) => item === value)) {
    throw new CatalogError("invalid_catalog_input", `${fieldName} is invalid.`, 400);
  }

  return value;
}

function readJsonValue(input: Record<string, unknown>, key: string): unknown {
  const value = input[key];

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new CatalogError("invalid_catalog_input", `${key} must be valid JSON.`, 400);
  }
}

function validateCustomFieldOptions(fieldType: string, options: unknown): unknown {
  if (fieldType !== "select" && fieldType !== "multiselect") {
    return options;
  }

  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new CatalogError(
      "invalid_catalog_input",
      "select fields require an options object.",
      400,
    );
  }

  const choices = (options as { choices?: unknown }).choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    throw new CatalogError(
      "invalid_catalog_input",
      "select fields require at least one choice.",
      400,
    );
  }

  for (const choice of choices) {
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) {
      throw new CatalogError("invalid_catalog_input", "field choices must be objects.", 400);
    }

    const value = (choice as { value?: unknown }).value;
    const label = (choice as { label?: unknown }).label;

    if (typeof value !== "string" || value.trim().length === 0) {
      throw new CatalogError("invalid_catalog_input", "field choice value is required.", 400);
    }

    if (typeof label !== "string" || label.trim().length === 0) {
      throw new CatalogError("invalid_catalog_input", "field choice label is required.", 400);
    }
  }

  return options;
}

function readRequiredFlag(input: Record<string, unknown>): string {
  const value = input.required;

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" ? "true" : "false";
  }

  return "false";
}

async function writeCatalogAudit(
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

export async function listCatalogOverview(
  sessionToken: string | undefined,
): Promise<CatalogOverview> {
  const session = await requirePermission(sessionToken, "catalog.manage");

  const [categories, types, customFields, manufacturers, models, vendors] = await Promise.all([
    listAssetCategoriesByTenant(session.tenant.id),
    listAssetTypesByTenant(session.tenant.id),
    listCustomFieldDefinitionsByTenant(session.tenant.id),
    listManufacturersByTenant(session.tenant.id),
    listAssetModelsByTenant(session.tenant.id),
    listVendorsByTenant(session.tenant.id),
  ]);

  return {
    categories,
    types,
    customFields,
    manufacturers,
    models,
    vendors,
  };
}

export async function listCatalogResource(
  sessionToken: string | undefined,
  resourceName: string,
): Promise<CatalogRecord[]> {
  const resource = requireCatalogResource(resourceName);
  const overview = await listCatalogOverview(sessionToken);

  switch (resource) {
    case "categories":
      return overview.categories;
    case "types":
      return overview.types;
    case "custom-fields":
      return overview.customFields;
    case "manufacturers":
      return overview.manufacturers;
    case "models":
      return overview.models;
    case "vendors":
      return overview.vendors;
  }
}

export async function createCatalogResource(
  sessionToken: string | undefined,
  resourceName: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<CatalogRecord> {
  const resource = requireCatalogResource(resourceName);
  const session = await requirePermission(sessionToken, "catalog.manage");
  const tenantId = session.tenant.id;
  const actorUserId = session.user.id;

  switch (resource) {
    case "categories": {
      const category = await createAssetCategory({
        tenantId,
        key: requireKey(input),
        name: requireString(input, "name"),
        description: readOptionalString(input, "description"),
      });
      await writeCatalogAudit(
        tenantId,
        actorUserId,
        "catalog.category_created",
        "asset_category",
        category.id,
        requestId,
      );
      return category;
    }
    case "types": {
      const trackingMode = readOptionalString(input, "trackingMode") ?? "asset";
      const assetType = await createAssetType({
        tenantId,
        categoryId: requireString(input, "categoryId"),
        key: requireKey(input),
        name: requireString(input, "name"),
        trackingMode: requireAllowedValue(trackingMode, allowedTrackingModes, "trackingMode"),
      });
      await writeCatalogAudit(
        tenantId,
        actorUserId,
        "catalog.asset_type_created",
        "asset_type",
        assetType.id,
        requestId,
      );
      return assetType;
    }
    case "custom-fields": {
      const fieldType = requireAllowedValue(
        requireString(input, "fieldType"),
        allowedFieldTypes,
        "fieldType",
      );
      const options = validateCustomFieldOptions(fieldType, readJsonValue(input, "options"));
      const field = await createCustomFieldDefinition({
        tenantId,
        assetTypeId: requireString(input, "assetTypeId"),
        key: requireKey(input),
        label: requireString(input, "label"),
        fieldType,
        options,
        validation: readJsonValue(input, "validation"),
        required: readRequiredFlag(input),
      });
      await writeCatalogAudit(
        tenantId,
        actorUserId,
        "catalog.custom_field_created",
        "custom_field",
        field.id,
        requestId,
      );
      return field;
    }
    case "manufacturers": {
      const manufacturer = await createManufacturer({
        tenantId,
        name: requireString(input, "name"),
      });
      await writeCatalogAudit(
        tenantId,
        actorUserId,
        "catalog.manufacturer_created",
        "manufacturer",
        manufacturer.id,
        requestId,
      );
      return manufacturer;
    }
    case "models": {
      const model = await createAssetModel({
        tenantId,
        manufacturerId: readOptionalString(input, "manufacturerId"),
        name: requireString(input, "name"),
        modelNumber: readOptionalString(input, "modelNumber"),
      });
      await writeCatalogAudit(
        tenantId,
        actorUserId,
        "catalog.model_created",
        "asset_model",
        model.id,
        requestId,
      );
      return model;
    }
    case "vendors": {
      const vendor = await createVendor({
        tenantId,
        name: requireString(input, "name"),
      });
      await writeCatalogAudit(
        tenantId,
        actorUserId,
        "catalog.vendor_created",
        "vendor",
        vendor.id,
        requestId,
      );
      return vendor;
    }
  }
}

export async function updateCatalogResource(
  sessionToken: string | undefined,
  resourceName: string,
  id: string,
  input: Record<string, unknown>,
  requestId?: string,
): Promise<CatalogRecord> {
  const resource = requireCatalogResource(resourceName);
  const session = await requirePermission(sessionToken, "catalog.manage");
  const tenantId = session.tenant.id;
  const actorUserId = session.user.id;
  let record: CatalogRecord | undefined;

  switch (resource) {
    case "categories": {
      const name = readOptionalString(input, "name");
      const description = readOptionalString(input, "description");
      const status = readOptionalString(input, "status");
      const patch: Parameters<typeof updateAssetCategory>[2] = {};

      if (name) patch.name = name;
      if (description) patch.description = description;
      if (status) patch.status = status;

      record = await updateAssetCategory(tenantId, id, patch);
      break;
    }
    case "types": {
      const categoryId = readOptionalString(input, "categoryId");
      const name = readOptionalString(input, "name");
      const trackingMode = readOptionalString(input, "trackingMode");
      const status = readOptionalString(input, "status");
      const patch: Parameters<typeof updateAssetType>[2] = {};

      if (categoryId) patch.categoryId = categoryId;
      if (name) patch.name = name;
      if (trackingMode) patch.trackingMode = trackingMode;
      if (status) patch.status = status;

      record = await updateAssetType(tenantId, id, patch);
      break;
    }
    case "custom-fields": {
      const label = readOptionalString(input, "label");
      const status = readOptionalString(input, "status");
      const patch: Parameters<typeof updateCustomFieldDefinition>[2] = {};

      if (label) patch.label = label;
      if (status) patch.status = status;

      record = await updateCustomFieldDefinition(tenantId, id, patch);
      break;
    }
    case "manufacturers": {
      const name = readOptionalString(input, "name");
      const website = readOptionalString(input, "website");
      const status = readOptionalString(input, "status");
      const patch: Parameters<typeof updateManufacturer>[2] = {};

      if (name) patch.name = name;
      if (website) patch.website = website;
      if (status) patch.status = status;

      record = await updateManufacturer(tenantId, id, patch);
      break;
    }
    case "models": {
      const manufacturerId = readOptionalString(input, "manufacturerId");
      const name = readOptionalString(input, "name");
      const modelNumber = readOptionalString(input, "modelNumber");
      const status = readOptionalString(input, "status");
      const patch: Parameters<typeof updateAssetModel>[2] = {};

      if (manufacturerId) patch.manufacturerId = manufacturerId;
      if (name) patch.name = name;
      if (modelNumber) patch.modelNumber = modelNumber;
      if (status) patch.status = status;

      record = await updateAssetModel(tenantId, id, patch);
      break;
    }
    case "vendors": {
      const name = readOptionalString(input, "name");
      const contactEmail = readOptionalString(input, "contactEmail");
      const status = readOptionalString(input, "status");
      const patch: Parameters<typeof updateVendor>[2] = {};

      if (name) patch.name = name;
      if (contactEmail) patch.contactEmail = contactEmail;
      if (status) patch.status = status;

      record = await updateVendor(tenantId, id, patch);
      break;
    }
  }

  if (!record) {
    throw new CatalogError("catalog_record_not_found", "Catalog record was not found.", 404);
  }

  await writeCatalogAudit(
    tenantId,
    actorUserId,
    `catalog.${resource}_updated`,
    resource,
    id,
    requestId,
  );

  return record;
}

export async function archiveCatalogResource(
  sessionToken: string | undefined,
  resourceName: string,
  id: string,
  requestId?: string,
): Promise<CatalogRecord> {
  const resource = requireCatalogResource(resourceName);
  const session = await requirePermission(sessionToken, "catalog.manage");
  const tenantId = session.tenant.id;

  if (resource === "categories" && (await countAssetTypesByCategory(tenantId, id)) > 0) {
    throw new CatalogError(
      "catalog_record_in_use",
      "Category cannot be archived while asset types use it.",
      409,
    );
  }

  if (resource === "types" && (await countAssetsByAssetType(tenantId, id)) > 0) {
    throw new CatalogError(
      "catalog_record_in_use",
      "Asset type cannot be archived while assets use it.",
      409,
    );
  }

  return updateCatalogResource(sessionToken, resource, id, { status: "archived" }, requestId);
}
