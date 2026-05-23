import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { pathToFileURL } from "node:url";

import { getEnv } from "@custivio/config";
import { and, eq, isNull } from "drizzle-orm";

import { closeDatabaseConnections, getDb } from "./client";
import {
  assetCategories,
  assetCustodyAssignments,
  assetIdentifiers,
  assetMaintenanceEvents,
  assetMaintenanceTickets,
  assetModels,
  assetTransferRequests,
  assetTypes,
  assetWarranties,
  assets,
  auditCampaigns,
  auditFindings,
  auditLogs,
  auditScanResults,
  bins,
  buildings,
  customFieldDefinitions,
  departments,
  exportJobs,
  floors,
  importJobRows,
  importJobs,
  manufacturers,
  organizations,
  passwordCredentials,
  racks,
  roles,
  rooms,
  savedFilters,
  shelves,
  sites,
  stockBalances,
  stockItems,
  stockLedgerEntries,
  stockLowStockRules,
  stockUnits,
  tenants,
  userRoleAssignments,
  users,
  vendors,
} from "./schema";
import { seedDatabase } from "./seed";

import type { ScryptOptions } from "node:crypto";

function requireUatEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`${key} must be set before running pnpm db:seed:uat.`);
  }

  return value;
}

const scryptCost = 16_384;
const scryptBlockSize = 8;
const scryptParallelization = 1;
const scryptKeyLength = 64;
const scryptMaxMemory = 64 * 1024 * 1024;

export function getUatSeedCredentials() {
  const env = getEnv();
  const localOnlyPassword = requireUatEnv(env.UAT_SEED_PASSWORD, "UAT_SEED_PASSWORD");

  return [
    {
      email: requireUatEnv(env.UAT_ADMIN_EMAIL, "UAT_ADMIN_EMAIL"),
      password: localOnlyPassword,
      roleKey: "administrator",
      displayName: "UAT Administrator",
      jobTitle: "Platform Administrator",
    },
    {
      email: requireUatEnv(env.UAT_MANAGER_EMAIL, "UAT_MANAGER_EMAIL"),
      password: localOnlyPassword,
      roleKey: "asset_manager",
      displayName: "UAT Asset Manager",
      jobTitle: "IT Asset Manager",
    },
    {
      email: requireUatEnv(env.UAT_STORE_EMAIL, "UAT_STORE_EMAIL"),
      password: localOnlyPassword,
      roleKey: "inventory_clerk",
      displayName: "UAT Store User",
      jobTitle: "Store and Inventory Operator",
    },
    {
      email: requireUatEnv(env.UAT_TECHNICIAN_EMAIL, "UAT_TECHNICIAN_EMAIL"),
      password: localOnlyPassword,
      roleKey: "technician",
      displayName: "UAT Technician",
      jobTitle: "Field Technician",
    },
    {
      email: requireUatEnv(env.UAT_APPROVER_EMAIL, "UAT_APPROVER_EMAIL"),
      password: localOnlyPassword,
      roleKey: "manager_approver",
      displayName: "UAT Manager Approver",
      jobTitle: "Operations Manager",
    },
    {
      email: requireUatEnv(env.UAT_AUDITOR_EMAIL, "UAT_AUDITOR_EMAIL"),
      password: localOnlyPassword,
      roleKey: "auditor",
      displayName: "UAT Auditor",
      jobTitle: "Internal Auditor",
    },
    {
      email: requireUatEnv(env.UAT_VIEWER_EMAIL, "UAT_VIEWER_EMAIL"),
      password: localOnlyPassword,
      roleKey: "viewer",
      displayName: "UAT Read-only Viewer",
      jobTitle: "Read-only Viewer",
    },
  ] as const;
}

export type UatSeedCredential = ReturnType<typeof getUatSeedCredentials>[number];

function deriveKey(password: string, salt: string, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, scryptKeyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

async function hashSeedPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = await deriveKey(password, salt, {
    N: scryptCost,
    r: scryptBlockSize,
    p: scryptParallelization,
    maxmem: scryptMaxMemory,
  });

  return [
    "scrypt",
    String(scryptCost),
    String(scryptBlockSize),
    String(scryptParallelization),
    salt,
    derived.toString("base64url"),
  ].join("$");
}

function checksumForSeedObject(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export async function seedUatDatabase(): Promise<void> {
  await seedDatabase();

  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "default")).limit(1);

  if (!tenant) {
    throw new Error("Default tenant must exist before UAT seed runs.");
  }

  const [organization] = await db
    .insert(organizations)
    .values({
      tenantId: tenant.id,
      code: "ITOPS",
      name: "Information Technology Operations",
      type: "business_unit",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [organizations.tenantId, organizations.code],
      set: {
        name: "Information Technology Operations",
        type: "business_unit",
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to seed UAT organization.");
  }

  const [operationsDepartment] = await db
    .insert(departments)
    .values({
      tenantId: tenant.id,
      organizationId: organization.id,
      code: "IT-INFRA",
      name: "Infrastructure Operations",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [departments.tenantId, departments.code],
      set: {
        organizationId: organization.id,
        name: "Infrastructure Operations",
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();
  const [storesDepartment] = await db
    .insert(departments)
    .values({
      tenantId: tenant.id,
      organizationId: organization.id,
      code: "IT-STORE",
      name: "IT Stores",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [departments.tenantId, departments.code],
      set: {
        organizationId: organization.id,
        name: "IT Stores",
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!operationsDepartment || !storesDepartment) {
    throw new Error("Failed to seed UAT departments.");
  }

  const roleRows = await db.select().from(roles).where(eq(roles.tenantId, tenant.id));
  const roleIdByKey = new Map(roleRows.map((role) => [role.key, role.id]));
  const uatSeedCredentials = getUatSeedCredentials();
  const userIdByEmail = new Map<string, string>();
  const userIdByRoleKey = new Map<string, string>();

  for (const credential of uatSeedCredentials) {
    const departmentId =
      credential.roleKey === "inventory_clerk" ? storesDepartment.id : operationsDepartment.id;
    const [user] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        organizationId: organization.id,
        departmentId,
        email: credential.email,
        displayName: credential.displayName,
        jobTitle: credential.jobTitle,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [users.tenantId, users.email],
        set: {
          organizationId: organization.id,
          departmentId,
          displayName: credential.displayName,
          jobTitle: credential.jobTitle,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!user) {
      throw new Error(`Failed to seed UAT user ${credential.email}.`);
    }

    userIdByEmail.set(credential.email, user.id);
    userIdByRoleKey.set(credential.roleKey, user.id);

    await db
      .insert(passwordCredentials)
      .values({
        tenantId: tenant.id,
        userId: user.id,
        passwordHash: await hashSeedPassword(credential.password),
        passwordUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: passwordCredentials.userId,
        set: {
          passwordHash: await hashSeedPassword(credential.password),
          passwordUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    const roleId = roleIdByKey.get(credential.roleKey);

    if (!roleId) {
      throw new Error(`Seed role is missing: ${credential.roleKey}`);
    }

    const [existingAssignment] = await db
      .select()
      .from(userRoleAssignments)
      .where(
        and(
          eq(userRoleAssignments.tenantId, tenant.id),
          eq(userRoleAssignments.userId, user.id),
          eq(userRoleAssignments.roleId, roleId),
          eq(userRoleAssignments.scopeType, "tenant"),
          isNull(userRoleAssignments.scopeId),
        ),
      )
      .limit(1);

    if (!existingAssignment) {
      await db.insert(userRoleAssignments).values({
        tenantId: tenant.id,
        userId: user.id,
        roleId,
        scopeType: "tenant",
      });
    }
  }

  const adminUserId = userIdByRoleKey.get("administrator");
  const managerUserId = userIdByRoleKey.get("asset_manager");
  const storeUserId = userIdByRoleKey.get("inventory_clerk");
  const auditorUserId = userIdByRoleKey.get("auditor");

  if (!adminUserId || !managerUserId || !storeUserId || !auditorUserId) {
    throw new Error("UAT users were not seeded.");
  }

  const [site] = await db
    .insert(sites)
    .values({ tenantId: tenant.id, code: "HQ", name: "Headquarters", status: "active" })
    .onConflictDoUpdate({
      target: [sites.tenantId, sites.code],
      set: { name: "Headquarters", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!site) {
    throw new Error("Failed to seed UAT site.");
  }

  const [building] = await db
    .insert(buildings)
    .values({
      tenantId: tenant.id,
      siteId: site.id,
      code: "HQ-A",
      name: "Headquarters Tower A",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [buildings.tenantId, buildings.siteId, buildings.code],
      set: { name: "Headquarters Tower A", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!building) {
    throw new Error("Failed to seed UAT building.");
  }

  const [floor] = await db
    .insert(floors)
    .values({
      tenantId: tenant.id,
      buildingId: building.id,
      code: "01",
      name: "First Floor",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [floors.tenantId, floors.buildingId, floors.code],
      set: { name: "First Floor", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!floor) {
    throw new Error("Failed to seed UAT floor.");
  }

  const [room] = await db
    .insert(rooms)
    .values({
      tenantId: tenant.id,
      floorId: floor.id,
      code: "IT-STOR",
      name: "IT Store Room",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [rooms.tenantId, rooms.floorId, rooms.code],
      set: { name: "IT Store Room", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!room) {
    throw new Error("Failed to seed UAT room.");
  }

  const [rack] = await db
    .insert(racks)
    .values({
      tenantId: tenant.id,
      roomId: room.id,
      code: "RACK-A1",
      name: "Rack A1",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [racks.tenantId, racks.roomId, racks.code],
      set: { name: "Rack A1", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!rack) {
    throw new Error("Failed to seed UAT rack.");
  }

  const [shelf] = await db
    .insert(shelves)
    .values({
      tenantId: tenant.id,
      rackId: rack.id,
      code: "SHELF-A",
      name: "Shelf A",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [shelves.tenantId, shelves.rackId, shelves.code],
      set: { name: "Shelf A", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!shelf) {
    throw new Error("Failed to seed UAT shelf.");
  }

  const [bin] = await db
    .insert(bins)
    .values({
      tenantId: tenant.id,
      shelfId: shelf.id,
      roomId: room.id,
      code: "BIN-SPARES-A",
      name: "Spares Bin A",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [bins.tenantId, bins.code],
      set: {
        shelfId: shelf.id,
        roomId: room.id,
        name: "Spares Bin A",
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!bin) {
    throw new Error("Failed to seed UAT bin.");
  }

  const categories = [
    { key: "hardware", name: "Hardware" },
    { key: "network", name: "Network Devices" },
    { key: "consumables", name: "Consumables" },
    { key: "components", name: "Components" },
    { key: "cables", name: "Cables" },
  ] as const;
  const categoryIdByKey = new Map<string, string>();

  for (const category of categories) {
    const [row] = await db
      .insert(assetCategories)
      .values({
        tenantId: tenant.id,
        key: category.key,
        name: category.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [assetCategories.tenantId, assetCategories.key],
        set: { name: category.name, status: "active", updatedAt: new Date() },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to seed category ${category.key}.`);
    }

    categoryIdByKey.set(category.key, row.id);
  }

  const assetTypeDefinitions = [
    { key: "laptop", name: "Laptop", categoryKey: "hardware", trackingMode: "asset" },
    { key: "server", name: "Server", categoryKey: "hardware", trackingMode: "asset" },
    {
      key: "network-switch",
      name: "Network Switch",
      categoryKey: "network",
      trackingMode: "asset",
    },
  ] as const;
  const assetTypeIdByKey = new Map<string, string>();

  for (const assetType of assetTypeDefinitions) {
    const categoryId = categoryIdByKey.get(assetType.categoryKey);

    if (!categoryId) {
      throw new Error(`Missing category for ${assetType.key}.`);
    }

    const [row] = await db
      .insert(assetTypes)
      .values({
        tenantId: tenant.id,
        categoryId,
        key: assetType.key,
        name: assetType.name,
        trackingMode: assetType.trackingMode,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [assetTypes.tenantId, assetTypes.key],
        set: {
          categoryId,
          name: assetType.name,
          trackingMode: assetType.trackingMode,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to seed asset type ${assetType.key}.`);
    }

    assetTypeIdByKey.set(assetType.key, row.id);
  }

  const laptopTypeId = assetTypeIdByKey.get("laptop");

  if (!laptopTypeId) {
    throw new Error("Laptop type was not seeded.");
  }

  const customFields = [
    {
      assetTypeId: laptopTypeId,
      key: "cpu",
      label: "CPU",
      fieldType: "text",
      required: "true",
      validation: { maxLength: 120 },
    },
    {
      assetTypeId: laptopTypeId,
      key: "ram_gb",
      label: "RAM GB",
      fieldType: "number",
      required: "true",
      validation: { min: 4, max: 256 },
    },
  ] as const;

  for (const field of customFields) {
    await db
      .insert(customFieldDefinitions)
      .values({
        tenantId: tenant.id,
        assetTypeId: field.assetTypeId,
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        validation: field.validation,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [
          customFieldDefinitions.tenantId,
          customFieldDefinitions.assetTypeId,
          customFieldDefinitions.key,
        ],
        set: {
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          validation: field.validation,
          status: "active",
          updatedAt: new Date(),
        },
      });
  }

  const manufacturerIdByName = new Map<string, string>();

  for (const manufacturer of ["Dell", "Cisco", "Generic Components"] as const) {
    const [row] = await db
      .insert(manufacturers)
      .values({ tenantId: tenant.id, name: manufacturer, status: "active" })
      .onConflictDoUpdate({
        target: [manufacturers.tenantId, manufacturers.name],
        set: { status: "active", updatedAt: new Date() },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to seed manufacturer ${manufacturer}.`);
    }

    manufacturerIdByName.set(manufacturer, row.id);
  }

  const [vendor] = await db
    .insert(vendors)
    .values({
      tenantId: tenant.id,
      name: "Acme IT Supply",
      contactEmail: "support@acme-it.example",
      status: "active",
    })
    .onConflictDoUpdate({
      target: [vendors.tenantId, vendors.name],
      set: {
        contactEmail: "support@acme-it.example",
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!vendor) {
    throw new Error("Failed to seed UAT vendor.");
  }

  const modelDefinitions = [
    { name: "Latitude 7440", modelNumber: "7440", manufacturer: "Dell" },
    { name: "PowerEdge R760", modelNumber: "R760", manufacturer: "Dell" },
    { name: "Catalyst 9300", modelNumber: "C9300-48P", manufacturer: "Cisco" },
  ] as const;
  const modelIdByName = new Map<string, string>();

  for (const model of modelDefinitions) {
    const [row] = await db
      .insert(assetModels)
      .values({
        tenantId: tenant.id,
        manufacturerId: manufacturerIdByName.get(model.manufacturer),
        name: model.name,
        modelNumber: model.modelNumber,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [assetModels.tenantId, assetModels.name],
        set: {
          manufacturerId: manufacturerIdByName.get(model.manufacturer),
          modelNumber: model.modelNumber,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to seed model ${model.name}.`);
    }

    modelIdByName.set(model.name, row.id);
  }

  const assetDefinitions = [
    {
      assetTag: "UAT-LAP-001",
      serialNumber: "UAT-SN-LAP-001",
      name: "UAT Finance Laptop",
      assetTypeKey: "laptop",
      modelName: "Latitude 7440",
      custodianUserId: managerUserId,
      status: "in_use",
      condition: "good",
      customFields: { cpu: "Intel Core i7", ram_gb: 32 },
    },
    {
      assetTag: "UAT-SRV-001",
      serialNumber: "UAT-SN-SRV-001",
      name: "UAT Rack Server",
      assetTypeKey: "server",
      modelName: "PowerEdge R760",
      custodianUserId: null,
      status: "in_stock",
      condition: "good",
      customFields: { rackUnits: 2 },
    },
    {
      assetTag: "UAT-NET-001",
      serialNumber: "UAT-SN-NET-001",
      name: "UAT Core Network Switch",
      assetTypeKey: "network-switch",
      modelName: "Catalyst 9300",
      custodianUserId: null,
      status: "in_service",
      condition: "good",
      customFields: { ports: 48 },
    },
  ] as const;
  const assetIdByTag = new Map<string, string>();

  for (const asset of assetDefinitions) {
    const assetTypeId = assetTypeIdByKey.get(asset.assetTypeKey);
    const modelId = modelIdByName.get(asset.modelName);

    if (!assetTypeId) {
      throw new Error(`Missing asset type for ${asset.assetTag}.`);
    }

    const [row] = await db
      .insert(assets)
      .values({
        tenantId: tenant.id,
        assetTypeId,
        modelId,
        vendorId: vendor.id,
        siteId: site.id,
        buildingId: building.id,
        floorId: floor.id,
        roomId: room.id,
        rackId: asset.assetTag === "UAT-LAP-001" ? null : rack.id,
        shelfId: asset.assetTag === "UAT-LAP-001" ? shelf.id : null,
        binId: asset.assetTag === "UAT-LAP-001" ? bin.id : null,
        custodianUserId: asset.custodianUserId,
        assetTag: asset.assetTag,
        serialNumber: asset.serialNumber,
        name: asset.name,
        status: asset.status,
        condition: asset.condition,
        customFields: asset.customFields,
      })
      .onConflictDoUpdate({
        target: [assets.tenantId, assets.assetTag],
        set: {
          assetTypeId,
          modelId,
          vendorId: vendor.id,
          siteId: site.id,
          buildingId: building.id,
          floorId: floor.id,
          roomId: room.id,
          rackId: asset.assetTag === "UAT-LAP-001" ? null : rack.id,
          shelfId: asset.assetTag === "UAT-LAP-001" ? shelf.id : null,
          binId: asset.assetTag === "UAT-LAP-001" ? bin.id : null,
          custodianUserId: asset.custodianUserId,
          serialNumber: asset.serialNumber,
          name: asset.name,
          status: asset.status,
          condition: asset.condition,
          customFields: asset.customFields,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to seed asset ${asset.assetTag}.`);
    }

    assetIdByTag.set(asset.assetTag, row.id);

    await db
      .insert(assetIdentifiers)
      .values({
        tenantId: tenant.id,
        assetId: row.id,
        identifierType: "qr",
        identifierValue: `qr:${asset.assetTag}`,
      })
      .onConflictDoUpdate({
        target: [
          assetIdentifiers.tenantId,
          assetIdentifiers.identifierType,
          assetIdentifiers.identifierValue,
        ],
        set: { assetId: row.id, updatedAt: new Date() },
      });
  }

  const [eachUnit] = await db
    .insert(stockUnits)
    .values({ tenantId: tenant.id, code: "EA", name: "Each", status: "active" })
    .onConflictDoUpdate({
      target: [stockUnits.tenantId, stockUnits.code],
      set: { name: "Each", status: "active", updatedAt: new Date() },
    })
    .returning();
  const [meterUnit] = await db
    .insert(stockUnits)
    .values({ tenantId: tenant.id, code: "MTR", name: "Meter", status: "active" })
    .onConflictDoUpdate({
      target: [stockUnits.tenantId, stockUnits.code],
      set: { name: "Meter", status: "active", updatedAt: new Date() },
    })
    .returning();

  if (!eachUnit || !meterUnit) {
    throw new Error("Failed to seed UAT stock units.");
  }

  const stockDefinitions = [
    {
      sku: "UAT-CABLE-CAT6-1M",
      name: "CAT6 Patch Cable",
      itemType: "cable",
      unitId: eachUnit.id,
      threshold: 20,
      quantity: 120,
    },
    {
      sku: "UAT-CONS-THERMAL-PASTE",
      name: "Thermal Paste Tube",
      itemType: "consumable",
      unitId: eachUnit.id,
      threshold: 10,
      quantity: 35,
    },
    {
      sku: "UAT-CHIP-TPM-2",
      name: "TPM 2.0 Module",
      itemType: "component",
      unitId: eachUnit.id,
      threshold: 5,
      quantity: 12,
    },
  ] as const;

  for (const item of stockDefinitions) {
    const [stockItem] = await db
      .insert(stockItems)
      .values({
        tenantId: tenant.id,
        unitId: item.unitId,
        sku: item.sku,
        name: item.name,
        itemType: item.itemType,
        lowStockThreshold: item.threshold,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [stockItems.tenantId, stockItems.sku],
        set: {
          unitId: item.unitId,
          name: item.name,
          itemType: item.itemType,
          lowStockThreshold: item.threshold,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!stockItem) {
      throw new Error(`Failed to seed stock item ${item.sku}.`);
    }

    await db
      .insert(stockBalances)
      .values({
        tenantId: tenant.id,
        stockItemId: stockItem.id,
        locationKey: bin.code,
        quantityOnHand: item.quantity,
      })
      .onConflictDoUpdate({
        target: [stockBalances.tenantId, stockBalances.stockItemId, stockBalances.locationKey],
        set: { quantityOnHand: item.quantity, updatedAt: new Date() },
      });

    await db
      .insert(stockLowStockRules)
      .values({
        tenantId: tenant.id,
        stockItemId: stockItem.id,
        locationKey: bin.code,
        threshold: item.threshold,
      })
      .onConflictDoUpdate({
        target: [
          stockLowStockRules.tenantId,
          stockLowStockRules.stockItemId,
          stockLowStockRules.locationKey,
        ],
        set: { threshold: item.threshold, updatedAt: new Date() },
      });

    await db
      .insert(stockLedgerEntries)
      .values({
        tenantId: tenant.id,
        stockItemId: stockItem.id,
        movementType: "receive",
        quantity: item.quantity,
        toLocationKey: bin.code,
        referenceId: `uat-seed-${item.sku}`,
        idempotencyKey: `uat-seed-stock-${item.sku}`,
        metadata: { source: "uat-seed", sku: item.sku },
        createdByUserId: storeUserId,
      })
      .onConflictDoUpdate({
        target: [stockLedgerEntries.tenantId, stockLedgerEntries.idempotencyKey],
        set: {
          stockItemId: stockItem.id,
          movementType: "receive",
          quantity: item.quantity,
          toLocationKey: bin.code,
          referenceId: `uat-seed-${item.sku}`,
          metadata: { source: "uat-seed", sku: item.sku },
          createdByUserId: storeUserId,
        },
      });
  }

  const laptopId = assetIdByTag.get("UAT-LAP-001");
  const serverId = assetIdByTag.get("UAT-SRV-001");
  const switchId = assetIdByTag.get("UAT-NET-001");

  if (!laptopId || !serverId || !switchId) {
    throw new Error("UAT assets were not seeded.");
  }

  const [existingCustody] = await db
    .select()
    .from(assetCustodyAssignments)
    .where(
      and(
        eq(assetCustodyAssignments.tenantId, tenant.id),
        eq(assetCustodyAssignments.assetId, laptopId),
        eq(assetCustodyAssignments.assignedToUserId, managerUserId),
        eq(assetCustodyAssignments.status, "active"),
      ),
    )
    .limit(1);

  if (!existingCustody) {
    await db.insert(assetCustodyAssignments).values({
      tenantId: tenant.id,
      assetId: laptopId,
      assignedToUserId: managerUserId,
      assignedByUserId: adminUserId,
      status: "active",
      notes: "UAT laptop assigned to asset manager.",
    });
  }

  const [existingTransfer] = await db
    .select()
    .from(assetTransferRequests)
    .where(
      and(
        eq(assetTransferRequests.tenantId, tenant.id),
        eq(assetTransferRequests.assetId, laptopId),
        eq(assetTransferRequests.toCustodianUserId, storeUserId),
        eq(assetTransferRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!existingTransfer) {
    await db.insert(assetTransferRequests).values({
      tenantId: tenant.id,
      assetId: laptopId,
      fromCustodianUserId: managerUserId,
      toCustodianUserId: storeUserId,
      requestedByUserId: managerUserId,
      status: "pending",
      reason: "UAT handover request for frontend workflow testing.",
    });
  }

  const [foundMaintenanceTicket] = await db
    .select()
    .from(assetMaintenanceTickets)
    .where(
      and(
        eq(assetMaintenanceTickets.tenantId, tenant.id),
        eq(assetMaintenanceTickets.assetId, serverId),
        eq(assetMaintenanceTickets.issueSummary, "UAT server fan health alert"),
      ),
    )
    .limit(1);
  const [insertedMaintenanceTicket] = foundMaintenanceTicket
    ? [foundMaintenanceTicket]
    : await db
        .insert(assetMaintenanceTickets)
        .values({
          tenantId: tenant.id,
          assetId: serverId,
          openedByUserId: managerUserId,
          assignedToUserId: storeUserId,
          status: "open",
          priority: "high",
          issueSummary: "UAT server fan health alert",
          downtimeMinutes: 0,
        })
        .returning();
  const existingMaintenanceTicket = insertedMaintenanceTicket;

  if (!existingMaintenanceTicket) {
    throw new Error("Failed to seed UAT maintenance ticket.");
  }

  const [existingMaintenanceEvent] = await db
    .select()
    .from(assetMaintenanceEvents)
    .where(
      and(
        eq(assetMaintenanceEvents.tenantId, tenant.id),
        eq(assetMaintenanceEvents.ticketId, existingMaintenanceTicket.id),
        eq(assetMaintenanceEvents.eventType, "ticket.opened"),
      ),
    )
    .limit(1);

  if (!existingMaintenanceEvent) {
    await db.insert(assetMaintenanceEvents).values({
      tenantId: tenant.id,
      ticketId: existingMaintenanceTicket.id,
      actorUserId: managerUserId,
      eventType: "ticket.opened",
      note: "UAT ticket opened for server maintenance workflow.",
      metadata: { source: "uat-seed" },
    });
  }

  const [existingWarranty] = await db
    .select()
    .from(assetWarranties)
    .where(
      and(
        eq(assetWarranties.tenantId, tenant.id),
        eq(assetWarranties.assetId, serverId),
        eq(assetWarranties.contractNumber, "UAT-WARRANTY-2026"),
      ),
    )
    .limit(1);

  if (!existingWarranty) {
    await db.insert(assetWarranties).values({
      tenantId: tenant.id,
      assetId: serverId,
      provider: "Acme IT Supply",
      contractNumber: "UAT-WARRANTY-2026",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2029-01-01T00:00:00.000Z"),
      status: "active",
      notes: "UAT warranty sample.",
    });
  }

  const [foundCampaign] = await db
    .select()
    .from(auditCampaigns)
    .where(
      and(eq(auditCampaigns.tenantId, tenant.id), eq(auditCampaigns.name, "UAT Q2 Hardware Audit")),
    )
    .limit(1);
  const [insertedCampaign] = foundCampaign
    ? [foundCampaign]
    : await db
        .insert(auditCampaigns)
        .values({
          tenantId: tenant.id,
          name: "UAT Q2 Hardware Audit",
          scope: "hq_it_store",
          status: "in_progress",
          plannedAt: new Date("2026-06-01T00:00:00.000Z"),
          startedAt: new Date("2026-06-02T09:00:00.000Z"),
          createdByUserId: auditorUserId,
        })
        .returning();
  const existingCampaign = insertedCampaign;

  if (!existingCampaign) {
    throw new Error("Failed to seed UAT audit campaign.");
  }

  const [scan] = await db
    .insert(auditScanResults)
    .values({
      tenantId: tenant.id,
      campaignId: existingCampaign.id,
      assetId: switchId,
      scanCode: "qr:UAT-NET-001",
      resultStatus: "found",
      notes: "Switch verified in rack during UAT seed.",
      scannedByUserId: auditorUserId,
    })
    .onConflictDoUpdate({
      target: [auditScanResults.campaignId, auditScanResults.scanCode],
      set: {
        tenantId: tenant.id,
        assetId: switchId,
        resultStatus: "found",
        notes: "Switch verified in rack during UAT seed.",
        scannedByUserId: auditorUserId,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!scan) {
    throw new Error("Failed to seed UAT audit scan.");
  }

  const [existingFinding] = await db
    .select()
    .from(auditFindings)
    .where(
      and(
        eq(auditFindings.tenantId, tenant.id),
        eq(auditFindings.campaignId, existingCampaign.id),
        eq(auditFindings.description, "UAT sample: rack label should be replaced."),
      ),
    )
    .limit(1);

  if (!existingFinding) {
    await db.insert(auditFindings).values({
      tenantId: tenant.id,
      campaignId: existingCampaign.id,
      scanResultId: scan.id,
      assetId: switchId,
      severity: "low",
      status: "open",
      description: "UAT sample: rack label should be replaced.",
    });
  }

  const [importJob] = await db
    .insert(importJobs)
    .values({
      tenantId: tenant.id,
      importType: "assets",
      status: "previewed",
      originalFilename: "uat-assets-import.csv",
      totalRows: 2,
      processedRows: 0,
      failedRows: 1,
      idempotencyKey: "uat-seed-import-assets",
      createdByUserId: managerUserId,
      metadata: { source: "uat-seed", requestHash: "uat-seed-import-assets" },
    })
    .onConflictDoUpdate({
      target: [importJobs.tenantId, importJobs.idempotencyKey],
      set: {
        importType: "assets",
        status: "previewed",
        originalFilename: "uat-assets-import.csv",
        totalRows: 2,
        processedRows: 0,
        failedRows: 1,
        createdByUserId: managerUserId,
        metadata: { source: "uat-seed", requestHash: "uat-seed-import-assets" },
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!importJob) {
    throw new Error("Failed to seed UAT import job.");
  }

  const importRows = [
    {
      rowNumber: 1,
      status: "valid",
      payload: { assetTag: "UAT-IMPORT-001", serialNumber: "UAT-IMPORT-SN-001" },
      diagnostics: [],
    },
    {
      rowNumber: 2,
      status: "invalid",
      payload: { assetTag: "", serialNumber: "UAT-IMPORT-SN-002" },
      diagnostics: ["assetTag is required"],
    },
  ] as const;

  for (const row of importRows) {
    await db
      .insert(importJobRows)
      .values({
        tenantId: tenant.id,
        importJobId: importJob.id,
        rowNumber: row.rowNumber,
        status: row.status,
        payload: row.payload,
        diagnostics: row.diagnostics,
      })
      .onConflictDoUpdate({
        target: [importJobRows.importJobId, importJobRows.rowNumber],
        set: {
          status: row.status,
          payload: row.payload,
          diagnostics: row.diagnostics,
        },
      });
  }

  const sampleExportBody = JSON.stringify({
    source: "uat-seed",
    note: "Create a fresh export through POST /api/reports/exports for downloadable objects.",
  });

  await db
    .insert(exportJobs)
    .values({
      tenantId: tenant.id,
      exportType: "assets",
      status: "pending",
      filename: "uat-assets-export.json",
      objectKey: "exports/default/uat-assets-export.json",
      contentLength: sampleExportBody.length,
      checksumSha256: checksumForSeedObject(sampleExportBody),
      filters: { status: "active" },
      idempotencyKey: "uat-seed-export-assets",
      createdByUserId: managerUserId,
    })
    .onConflictDoUpdate({
      target: [exportJobs.tenantId, exportJobs.idempotencyKey],
      set: {
        exportType: "assets",
        status: "pending",
        filename: "uat-assets-export.json",
        objectKey: "exports/default/uat-assets-export.json",
        contentLength: sampleExportBody.length,
        checksumSha256: checksumForSeedObject(sampleExportBody),
        filters: { status: "active" },
        createdByUserId: managerUserId,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(savedFilters)
    .values({
      tenantId: tenant.id,
      module: "assets",
      key: "uat-active-assets",
      name: "UAT Active Assets",
      filters: { status: "active" },
      createdByUserId: managerUserId,
    })
    .onConflictDoUpdate({
      target: [savedFilters.tenantId, savedFilters.module, savedFilters.key],
      set: {
        name: "UAT Active Assets",
        filters: { status: "active" },
        createdByUserId: managerUserId,
        updatedAt: new Date(),
      },
    });

  const [existingSeedLog] = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenant.id),
        eq(auditLogs.action, "system.seed.uat"),
        eq(auditLogs.entityType, "tenant"),
      ),
    )
    .limit(1);

  if (!existingSeedLog) {
    await db.insert(auditLogs).values({
      tenantId: tenant.id,
      actorUserId: adminUserId,
      action: "system.seed.uat",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: {
        source: "uat-seed",
        localOnlyUsers: uatSeedCredentials.map((credential) => credential.email),
      },
    });
  }
}

async function runSeedCli(): Promise<void> {
  try {
    await seedUatDatabase();
  } finally {
    await closeDatabaseConnections();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runSeedCli();
}
