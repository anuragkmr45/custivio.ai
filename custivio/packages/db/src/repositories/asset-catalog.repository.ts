import { and, asc, count, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  assetCategories,
  assetModels,
  assets,
  assetTypes,
  customFieldDefinitions,
  manufacturers,
  vendors,
  type AssetCategory,
  type AssetModel,
  type AssetType,
  type CustomFieldDefinition,
  type Manufacturer,
  type NewAssetCategory,
  type NewAssetModel,
  type NewAssetType,
  type NewCustomFieldDefinition,
  type NewManufacturer,
  type NewVendor,
  type Vendor,
} from "../schema";

export async function createAssetCategory(
  values: Pick<NewAssetCategory, "tenantId" | "key" | "name"> &
    Partial<Pick<NewAssetCategory, "description">>,
): Promise<AssetCategory> {
  const [category] = await getDb()
    .insert(assetCategories)
    .values({ ...values, key: values.key.toLowerCase(), status: "active" })
    .returning();

  if (!category) {
    throw new Error("Failed to create asset category.");
  }

  return category;
}

export async function listAssetCategoriesByTenant(tenantId: string): Promise<AssetCategory[]> {
  return getDb()
    .select()
    .from(assetCategories)
    .where(eq(assetCategories.tenantId, tenantId))
    .orderBy(asc(assetCategories.name), asc(assetCategories.key));
}

export async function updateAssetCategory(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewAssetCategory, "name" | "description" | "status">>,
): Promise<AssetCategory | undefined> {
  const [category] = await getDb()
    .update(assetCategories)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(assetCategories.tenantId, tenantId), eq(assetCategories.id, id)))
    .returning();

  return category;
}

export async function countAssetTypesByCategory(
  tenantId: string,
  categoryId: string,
): Promise<number> {
  const [result] = await getDb()
    .select({ value: count() })
    .from(assetTypes)
    .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.categoryId, categoryId)));

  return result?.value ?? 0;
}

export async function createAssetType(
  values: Pick<NewAssetType, "tenantId" | "categoryId" | "key" | "name"> &
    Partial<Pick<NewAssetType, "trackingMode">>,
): Promise<AssetType> {
  const [assetType] = await getDb()
    .insert(assetTypes)
    .values({
      tenantId: values.tenantId,
      categoryId: values.categoryId,
      key: values.key.toLowerCase(),
      name: values.name,
      trackingMode: values.trackingMode ?? "asset",
      status: "active",
    })
    .returning();

  if (!assetType) {
    throw new Error("Failed to create asset type.");
  }

  return assetType;
}

export async function listAssetTypesByTenant(tenantId: string): Promise<AssetType[]> {
  return getDb()
    .select()
    .from(assetTypes)
    .where(eq(assetTypes.tenantId, tenantId))
    .orderBy(asc(assetTypes.name), asc(assetTypes.key));
}

export async function updateAssetType(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewAssetType, "categoryId" | "name" | "trackingMode" | "status">>,
): Promise<AssetType | undefined> {
  const [assetType] = await getDb()
    .update(assetTypes)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.id, id)))
    .returning();

  return assetType;
}

export async function countAssetsByAssetType(
  tenantId: string,
  assetTypeId: string,
): Promise<number> {
  const [result] = await getDb()
    .select({ value: count() })
    .from(assets)
    .where(and(eq(assets.tenantId, tenantId), eq(assets.assetTypeId, assetTypeId)));

  return result?.value ?? 0;
}

export async function createCustomFieldDefinition(
  values: Pick<
    NewCustomFieldDefinition,
    "tenantId" | "assetTypeId" | "key" | "label" | "fieldType"
  > &
    Partial<Pick<NewCustomFieldDefinition, "options" | "validation" | "required">>,
): Promise<CustomFieldDefinition> {
  const [field] = await getDb()
    .insert(customFieldDefinitions)
    .values({
      tenantId: values.tenantId,
      assetTypeId: values.assetTypeId,
      key: values.key.toLowerCase(),
      label: values.label,
      fieldType: values.fieldType,
      options: values.options,
      validation: values.validation,
      required: values.required ?? "false",
      status: "active",
    })
    .returning();

  if (!field) {
    throw new Error("Failed to create custom field definition.");
  }

  return field;
}

export async function listCustomFieldDefinitionsByTenant(
  tenantId: string,
): Promise<CustomFieldDefinition[]> {
  return getDb()
    .select()
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.tenantId, tenantId))
    .orderBy(asc(customFieldDefinitions.label), asc(customFieldDefinitions.key));
}

export async function updateCustomFieldDefinition(
  tenantId: string,
  id: string,
  values: Partial<
    Pick<
      NewCustomFieldDefinition,
      "label" | "fieldType" | "options" | "validation" | "required" | "status"
    >
  >,
): Promise<CustomFieldDefinition | undefined> {
  const [field] = await getDb()
    .update(customFieldDefinitions)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(customFieldDefinitions.tenantId, tenantId), eq(customFieldDefinitions.id, id)))
    .returning();

  return field;
}

export async function createManufacturer(
  values: Pick<NewManufacturer, "tenantId" | "name">,
): Promise<Manufacturer> {
  const [manufacturer] = await getDb()
    .insert(manufacturers)
    .values({ tenantId: values.tenantId, name: values.name, status: "active" })
    .returning();

  if (!manufacturer) {
    throw new Error("Failed to create manufacturer.");
  }

  return manufacturer;
}

export async function listManufacturersByTenant(tenantId: string): Promise<Manufacturer[]> {
  return getDb()
    .select()
    .from(manufacturers)
    .where(eq(manufacturers.tenantId, tenantId))
    .orderBy(asc(manufacturers.name));
}

export async function updateManufacturer(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewManufacturer, "name" | "website" | "status">>,
): Promise<Manufacturer | undefined> {
  const [manufacturer] = await getDb()
    .update(manufacturers)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(manufacturers.tenantId, tenantId), eq(manufacturers.id, id)))
    .returning();

  return manufacturer;
}

export async function createAssetModel(
  values: Pick<NewAssetModel, "tenantId" | "name"> &
    Partial<Pick<NewAssetModel, "manufacturerId" | "modelNumber">>,
): Promise<AssetModel> {
  const [assetModel] = await getDb()
    .insert(assetModels)
    .values({
      tenantId: values.tenantId,
      manufacturerId: values.manufacturerId,
      name: values.name,
      modelNumber: values.modelNumber,
      status: "active",
    })
    .returning();

  if (!assetModel) {
    throw new Error("Failed to create asset model.");
  }

  return assetModel;
}

export async function listAssetModelsByTenant(tenantId: string): Promise<AssetModel[]> {
  return getDb()
    .select()
    .from(assetModels)
    .where(eq(assetModels.tenantId, tenantId))
    .orderBy(asc(assetModels.name));
}

export async function updateAssetModel(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewAssetModel, "manufacturerId" | "name" | "modelNumber" | "status">>,
): Promise<AssetModel | undefined> {
  const [assetModel] = await getDb()
    .update(assetModels)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(assetModels.tenantId, tenantId), eq(assetModels.id, id)))
    .returning();

  return assetModel;
}

export async function createVendor(values: Pick<NewVendor, "tenantId" | "name">): Promise<Vendor> {
  const [vendor] = await getDb()
    .insert(vendors)
    .values({ tenantId: values.tenantId, name: values.name, status: "active" })
    .returning();

  if (!vendor) {
    throw new Error("Failed to create vendor.");
  }

  return vendor;
}

export async function listVendorsByTenant(tenantId: string): Promise<Vendor[]> {
  return getDb()
    .select()
    .from(vendors)
    .where(eq(vendors.tenantId, tenantId))
    .orderBy(asc(vendors.name));
}

export async function updateVendor(
  tenantId: string,
  id: string,
  values: Partial<Pick<NewVendor, "name" | "contactEmail" | "status">>,
): Promise<Vendor | undefined> {
  const [vendor] = await getDb()
    .update(vendors)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(vendors.tenantId, tenantId), eq(vendors.id, id)))
    .returning();

  return vendor;
}

export async function findAssetTypeByKey(
  tenantId: string,
  key: string,
): Promise<AssetType | undefined> {
  const [assetType] = await getDb()
    .select()
    .from(assetTypes)
    .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.key, key)))
    .limit(1);

  return assetType;
}
