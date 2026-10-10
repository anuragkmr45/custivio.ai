import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

import { getEnv } from "@custivio/config";
import { and, count, eq, isNull } from "drizzle-orm";

import { bootstrapAdmin } from "./bootstrap-admin";
import { closeDatabaseConnections, getDb } from "./client";
import {
  assetCategories,
  assetCustodyAssignments,
  assetIdentifiers,
  assetLifecycleEvents,
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
  racks,
  roles,
  rooms,
  savedFilters,
  shelves,
  sites,
  stockAdjustments,
  stockBalances,
  stockItems,
  stockLedgerEntries,
  stockLowStockRules,
  stockTransfers,
  stockUnits,
  tenants,
  userRoleAssignments,
  users,
  vendors,
} from "./schema";

const demoSource = "custivio-showcase-seed-v1";

function required(value: string | undefined, key: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${key} must be set before running pnpm db:seed:showcase.`);
  return normalized;
}

async function insertLifecycleEventOnce(input: {
  tenantId: string;
  assetId: string;
  actorUserId: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: assetLifecycleEvents.id })
    .from(assetLifecycleEvents)
    .where(
      and(
        eq(assetLifecycleEvents.tenantId, input.tenantId),
        eq(assetLifecycleEvents.assetId, input.assetId),
        eq(assetLifecycleEvents.eventType, input.eventType),
      ),
    )
    .limit(1);

  if (!existing) await db.insert(assetLifecycleEvents).values(input);
}

export async function seedShowcaseDatabase(): Promise<Record<string, number>> {
  const env = getEnv();
  const tenantSlug = required(env.BOOTSTRAP_TENANT_SLUG, "BOOTSTRAP_TENANT_SLUG");
  const tenantName = required(env.BOOTSTRAP_TENANT_NAME, "BOOTSTRAP_TENANT_NAME");
  const adminEmail = required(env.BOOTSTRAP_ADMIN_EMAIL, "BOOTSTRAP_ADMIN_EMAIL");
  const adminName = required(env.BOOTSTRAP_ADMIN_NAME, "BOOTSTRAP_ADMIN_NAME");
  const adminPassword = required(env.BOOTSTRAP_ADMIN_PASSWORD, "BOOTSTRAP_ADMIN_PASSWORD");

  const bootstrap = await bootstrapAdmin({
    tenantSlug,
    tenantName,
    adminEmail,
    adminName,
    adminPassword,
  });
  const db = getDb();
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, bootstrap.tenantId))
    .limit(1);
  if (!tenant) throw new Error("Showcase tenant was not found after administrator bootstrap.");

  const organizationDefinitions = [
    { code: "NSD-CORP", name: "Northstar Digital Services Pvt. Ltd.", type: "company" },
    { code: "NSD-TECH", name: "Technology Operations", type: "business_unit" },
    { code: "NSD-BIZ", name: "Business Operations", type: "business_unit" },
  ] as const;
  const organizationIdByCode = new Map<string, string>();
  for (const definition of organizationDefinitions) {
    const [row] = await db
      .insert(organizations)
      .values({ tenantId: tenant.id, ...definition, status: "active" })
      .onConflictDoUpdate({
        target: [organizations.tenantId, organizations.code],
        set: {
          name: definition.name,
          type: definition.type,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed organization ${definition.code}.`);
    organizationIdByCode.set(definition.code, row.id);
  }

  const departmentDefinitions = [
    { code: "IT-AM", name: "IT Asset Management", organizationCode: "NSD-TECH" },
    { code: "IT-INFRA", name: "Infrastructure and Cloud", organizationCode: "NSD-TECH" },
    { code: "IT-SD", name: "Service Desk", organizationCode: "NSD-TECH" },
    { code: "FIN", name: "Finance and Accounts", organizationCode: "NSD-BIZ" },
    { code: "HR", name: "People Operations", organizationCode: "NSD-BIZ" },
    { code: "PROC", name: "Procurement", organizationCode: "NSD-BIZ" },
  ] as const;
  const departmentIdByCode = new Map<string, string>();
  for (const definition of departmentDefinitions) {
    const organizationId = organizationIdByCode.get(definition.organizationCode);
    if (!organizationId) throw new Error(`Missing organization ${definition.organizationCode}.`);
    const [row] = await db
      .insert(departments)
      .values({
        tenantId: tenant.id,
        organizationId,
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [departments.tenantId, departments.code],
        set: { organizationId, name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed department ${definition.code}.`);
    departmentIdByCode.set(definition.code, row.id);
  }

  const roleRows = await db.select().from(roles).where(eq(roles.tenantId, tenant.id));
  const roleIdByKey = new Map(roleRows.map((row) => [row.key, row.id]));
  const userDefinitions = [
    {
      email: adminEmail.toLowerCase(),
      name: adminName,
      title: "Platform Administrator",
      department: "IT-AM",
      role: "administrator",
    },
    {
      email: "meera.iyer@northstar.example",
      name: "Meera Iyer",
      title: "IT Asset Manager",
      department: "IT-AM",
      role: "asset_manager",
    },
    {
      email: "arjun.nair@northstar.example",
      name: "Arjun Nair",
      title: "Inventory Controller",
      department: "IT-AM",
      role: "inventory_clerk",
    },
    {
      email: "vikram.singh@northstar.example",
      name: "Vikram Singh",
      title: "Senior Infrastructure Engineer",
      department: "IT-INFRA",
      role: "technician",
    },
    {
      email: "ananya.rao@northstar.example",
      name: "Ananya Rao",
      title: "Service Desk Engineer",
      department: "IT-SD",
      role: "technician",
    },
    {
      email: "rahul.mehta@northstar.example",
      name: "Rahul Mehta",
      title: "Director of Technology",
      department: "IT-INFRA",
      role: "manager_approver",
    },
    {
      email: "kavya.shah@northstar.example",
      name: "Kavya Shah",
      title: "Internal Auditor",
      department: "FIN",
      role: "auditor",
    },
    {
      email: "neha.kapoor@northstar.example",
      name: "Neha Kapoor",
      title: "Finance Manager",
      department: "FIN",
      role: "viewer",
    },
    {
      email: "rohan.patel@northstar.example",
      name: "Rohan Patel",
      title: "Procurement Specialist",
      department: "PROC",
      role: "viewer",
    },
    {
      email: "sana.khan@northstar.example",
      name: "Sana Khan",
      title: "People Operations Manager",
      department: "HR",
      role: "viewer",
    },
  ] as const;
  const userIdByEmail = new Map<string, string>();
  for (const definition of userDefinitions) {
    const organizationId = organizationIdByCode.get(
      definition.department.startsWith("IT-") ? "NSD-TECH" : "NSD-BIZ",
    );
    const departmentId = departmentIdByCode.get(definition.department);
    const [row] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        organizationId,
        departmentId,
        email: definition.email,
        displayName: definition.name,
        jobTitle: definition.title,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [users.tenantId, users.email],
        set: {
          organizationId,
          departmentId,
          displayName: definition.name,
          jobTitle: definition.title,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed user ${definition.email}.`);
    userIdByEmail.set(definition.email, row.id);

    const roleId = roleIdByKey.get(definition.role);
    if (!roleId) throw new Error(`Missing role ${definition.role}.`);
    const [assignment] = await db
      .select({ id: userRoleAssignments.id })
      .from(userRoleAssignments)
      .where(
        and(
          eq(userRoleAssignments.tenantId, tenant.id),
          eq(userRoleAssignments.userId, row.id),
          eq(userRoleAssignments.roleId, roleId),
          eq(userRoleAssignments.scopeType, "tenant"),
          isNull(userRoleAssignments.scopeId),
        ),
      )
      .limit(1);
    if (!assignment) {
      await db
        .insert(userRoleAssignments)
        .values({ tenantId: tenant.id, userId: row.id, roleId, scopeType: "tenant" });
    }
  }

  const adminUserId = userIdByEmail.get(adminEmail.toLowerCase()) ?? bootstrap.adminUserId;
  const assetManagerId = required(
    userIdByEmail.get("meera.iyer@northstar.example"),
    "asset manager user",
  );
  const inventoryUserId = required(
    userIdByEmail.get("arjun.nair@northstar.example"),
    "inventory user",
  );
  const technicianId = required(
    userIdByEmail.get("vikram.singh@northstar.example"),
    "technician user",
  );
  const approverId = required(userIdByEmail.get("rahul.mehta@northstar.example"), "approver user");
  const auditorId = required(userIdByEmail.get("kavya.shah@northstar.example"), "auditor user");

  const siteDefinitions = [
    { code: "BLR-HQ", name: "Bengaluru Headquarters" },
    { code: "MUM-BR", name: "Mumbai Regional Office" },
    { code: "HYD-DR", name: "Hyderabad Disaster Recovery Facility" },
  ] as const;
  const siteIdByCode = new Map<string, string>();
  for (const definition of siteDefinitions) {
    const [row] = await db
      .insert(sites)
      .values({ tenantId: tenant.id, ...definition, status: "active" })
      .onConflictDoUpdate({
        target: [sites.tenantId, sites.code],
        set: { name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed site ${definition.code}.`);
    siteIdByCode.set(definition.code, row.id);
  }

  const buildingDefinitions = [
    { site: "BLR-HQ", code: "BLR-A", name: "Orion Tech Park - Tower A" },
    { site: "MUM-BR", code: "MUM-1", name: "Bandra Kurla Office" },
    { site: "HYD-DR", code: "HYD-DC", name: "HITEC City Data Centre" },
  ] as const;
  const buildingIdByCode = new Map<string, string>();
  for (const definition of buildingDefinitions) {
    const siteId = required(siteIdByCode.get(definition.site), `site ${definition.site}`);
    const [row] = await db
      .insert(buildings)
      .values({
        tenantId: tenant.id,
        siteId,
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [buildings.tenantId, buildings.siteId, buildings.code],
        set: { name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed building ${definition.code}.`);
    buildingIdByCode.set(definition.code, row.id);
  }

  const floorDefinitions = [
    { building: "BLR-A", code: "03", name: "Third Floor - Corporate Services" },
    { building: "BLR-A", code: "05", name: "Fifth Floor - Technology" },
    { building: "MUM-1", code: "08", name: "Eighth Floor - Regional Office" },
    { building: "HYD-DC", code: "G", name: "Ground Floor - Data Hall" },
  ] as const;
  const floorIdByKey = new Map<string, string>();
  for (const definition of floorDefinitions) {
    const buildingId = required(
      buildingIdByCode.get(definition.building),
      `building ${definition.building}`,
    );
    const [row] = await db
      .insert(floors)
      .values({
        tenantId: tenant.id,
        buildingId,
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [floors.tenantId, floors.buildingId, floors.code],
        set: { name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed floor ${definition.building}/${definition.code}.`);
    floorIdByKey.set(`${definition.building}/${definition.code}`, row.id);
  }

  const roomDefinitions = [
    { floor: "BLR-A/03", code: "FIN-301", name: "Finance Operations" },
    { floor: "BLR-A/05", code: "IT-STORE", name: "IT Asset Store" },
    { floor: "BLR-A/05", code: "NOC-501", name: "Network Operations Centre" },
    { floor: "MUM-1/08", code: "MUM-IT", name: "Mumbai IT Support Room" },
    { floor: "HYD-DC/G", code: "DATA-A", name: "Primary Data Hall" },
  ] as const;
  const roomIdByCode = new Map<string, string>();
  for (const definition of roomDefinitions) {
    const floorId = required(floorIdByKey.get(definition.floor), `floor ${definition.floor}`);
    const [row] = await db
      .insert(rooms)
      .values({
        tenantId: tenant.id,
        floorId,
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [rooms.tenantId, rooms.floorId, rooms.code],
        set: { name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed room ${definition.code}.`);
    roomIdByCode.set(definition.code, row.id);
  }

  const rackDefinitions = [
    { room: "IT-STORE", code: "STORE-R01", name: "IT Store Rack 01" },
    { room: "NOC-501", code: "NOC-R01", name: "NOC Network Rack 01" },
    { room: "MUM-IT", code: "MUM-R01", name: "Mumbai Network Rack" },
    { room: "DATA-A", code: "DC-R01", name: "Compute Rack 01" },
    { room: "DATA-A", code: "DC-R02", name: "Network Rack 02" },
  ] as const;
  const rackIdByCode = new Map<string, string>();
  for (const definition of rackDefinitions) {
    const roomId = required(roomIdByCode.get(definition.room), `room ${definition.room}`);
    const [row] = await db
      .insert(racks)
      .values({
        tenantId: tenant.id,
        roomId,
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [racks.tenantId, racks.roomId, racks.code],
        set: { name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed rack ${definition.code}.`);
    rackIdByCode.set(definition.code, row.id);
  }

  const shelfDefinitions = [
    { rack: "STORE-R01", code: "SH-A", name: "Laptops and Accessories" },
    { rack: "STORE-R01", code: "SH-B", name: "Components and Spares" },
  ] as const;
  const shelfIdByCode = new Map<string, string>();
  for (const definition of shelfDefinitions) {
    const rackId = required(rackIdByCode.get(definition.rack), `rack ${definition.rack}`);
    const [row] = await db
      .insert(shelves)
      .values({
        tenantId: tenant.id,
        rackId,
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [shelves.tenantId, shelves.rackId, shelves.code],
        set: { name: definition.name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed shelf ${definition.code}.`);
    shelfIdByCode.set(definition.code, row.id);
  }

  const binDefinitions = [
    { shelf: "SH-A", room: "IT-STORE", code: "BLR-LAPTOPS", name: "Ready-to-Issue Laptops" },
    { shelf: "SH-A", room: "IT-STORE", code: "BLR-ACCESSORIES", name: "Accessories" },
    { shelf: "SH-B", room: "IT-STORE", code: "BLR-SPARES", name: "Hardware Spares" },
    { shelf: undefined, room: "MUM-IT", code: "MUM-STOCK", name: "Mumbai Local Stock" },
  ] as const;
  const binIdByCode = new Map<string, string>();
  for (const definition of binDefinitions) {
    const [row] = await db
      .insert(bins)
      .values({
        tenantId: tenant.id,
        shelfId: definition.shelf ? shelfIdByCode.get(definition.shelf) : undefined,
        roomId: required(roomIdByCode.get(definition.room), `room ${definition.room}`),
        code: definition.code,
        name: definition.name,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [bins.tenantId, bins.code],
        set: {
          shelfId: definition.shelf ? shelfIdByCode.get(definition.shelf) : null,
          roomId: required(roomIdByCode.get(definition.room), `room ${definition.room}`),
          name: definition.name,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed bin ${definition.code}.`);
    binIdByCode.set(definition.code, row.id);
  }

  const categoryDefinitions = [
    ["computing", "End-User Computing", "Laptops, desktops, tablets and mobile devices"],
    ["server", "Servers", "Physical compute and virtualization hosts"],
    ["network", "Network and Security", "Switches, routers, firewalls and wireless equipment"],
    ["power", "Power and Data Centre", "UPS and supporting data-centre equipment"],
    ["peripheral", "Peripherals", "Monitors, printers and meeting-room equipment"],
    ["stock", "Spares and Consumables", "Replaceable components and operating consumables"],
  ] as const;
  const categoryIdByKey = new Map<string, string>();
  for (const [key, name, description] of categoryDefinitions) {
    const [row] = await db
      .insert(assetCategories)
      .values({ tenantId: tenant.id, key, name, description, status: "active" })
      .onConflictDoUpdate({
        target: [assetCategories.tenantId, assetCategories.key],
        set: { name, description, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed category ${key}.`);
    categoryIdByKey.set(key, row.id);
  }

  const typeDefinitions = [
    ["laptop", "Laptop", "computing"],
    ["desktop", "Desktop Workstation", "computing"],
    ["server", "Rack Server", "server"],
    ["switch", "Network Switch", "network"],
    ["firewall", "Firewall Appliance", "network"],
    ["access-point", "Wireless Access Point", "network"],
    ["ups", "Uninterruptible Power Supply", "power"],
    ["monitor", "Monitor", "peripheral"],
    ["printer", "Printer", "peripheral"],
  ] as const;
  const typeIdByKey = new Map<string, string>();
  for (const [key, name, categoryKey] of typeDefinitions) {
    const [row] = await db
      .insert(assetTypes)
      .values({
        tenantId: tenant.id,
        categoryId: required(categoryIdByKey.get(categoryKey), `category ${categoryKey}`),
        key,
        name,
        trackingMode: "asset",
        status: "active",
      })
      .onConflictDoUpdate({
        target: [assetTypes.tenantId, assetTypes.key],
        set: {
          categoryId: required(categoryIdByKey.get(categoryKey), `category ${categoryKey}`),
          name,
          trackingMode: "asset",
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed asset type ${key}.`);
    typeIdByKey.set(key, row.id);
  }

  const customFields = [
    {
      type: "laptop",
      key: "processor",
      label: "Processor",
      fieldType: "text",
      required: "true",
      validation: { maxLength: 120 },
    },
    {
      type: "laptop",
      key: "memory_gb",
      label: "Memory (GB)",
      fieldType: "number",
      required: "true",
      validation: { min: 8, max: 256 },
    },
    {
      type: "server",
      key: "rack_units",
      label: "Rack Units",
      fieldType: "number",
      required: "true",
      validation: { min: 1, max: 48 },
    },
    {
      type: "switch",
      key: "port_count",
      label: "Port Count",
      fieldType: "number",
      required: "true",
      validation: { min: 8, max: 128 },
    },
  ] as const;
  for (const field of customFields) {
    const assetTypeId = required(typeIdByKey.get(field.type), `type ${field.type}`);
    await db
      .insert(customFieldDefinitions)
      .values({
        tenantId: tenant.id,
        assetTypeId,
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

  const manufacturerDefinitions = [
    ["Dell Technologies", "https://www.dell.com"],
    ["Lenovo", "https://www.lenovo.com"],
    ["Apple", "https://www.apple.com"],
    ["Cisco", "https://www.cisco.com"],
    ["Hewlett Packard Enterprise", "https://www.hpe.com"],
    ["Fortinet", "https://www.fortinet.com"],
    ["APC by Schneider Electric", "https://www.apc.com"],
    ["Samsung", "https://www.samsung.com"],
    ["HP", "https://www.hp.com"],
  ] as const;
  const manufacturerIdByName = new Map<string, string>();
  for (const [name, website] of manufacturerDefinitions) {
    const [row] = await db
      .insert(manufacturers)
      .values({ tenantId: tenant.id, name, website, status: "active" })
      .onConflictDoUpdate({
        target: [manufacturers.tenantId, manufacturers.name],
        set: { website, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed manufacturer ${name}.`);
    manufacturerIdByName.set(name, row.id);
  }

  const vendorDefinitions = [
    ["Redington India Limited", "enterprise.sales@redington.example"],
    ["Ingram Micro India", "business@ingrammicro.example"],
    ["NetSecure Systems", "support@netsecure.example"],
  ] as const;
  const vendorIdByName = new Map<string, string>();
  for (const [name, contactEmail] of vendorDefinitions) {
    const [row] = await db
      .insert(vendors)
      .values({ tenantId: tenant.id, name, contactEmail, status: "active" })
      .onConflictDoUpdate({
        target: [vendors.tenantId, vendors.name],
        set: { contactEmail, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed vendor ${name}.`);
    vendorIdByName.set(name, row.id);
  }

  const modelDefinitions = [
    ["Latitude 7440", "LAT-7440", "Dell Technologies"],
    ["ThinkPad T14 Gen 4", "21HD", "Lenovo"],
    ["MacBook Pro 14-inch", "MRX33HN/A", "Apple"],
    ["OptiPlex 7010", "OPT-7010", "Dell Technologies"],
    ["PowerEdge R760", "PER760", "Dell Technologies"],
    ["ProLiant DL380 Gen11", "P52560-B21", "Hewlett Packard Enterprise"],
    ["Catalyst 9300-48P", "C9300-48P", "Cisco"],
    ["FortiGate 100F", "FG-100F", "Fortinet"],
    ["Catalyst 9120AXI", "C9120AXI", "Cisco"],
    ["Smart-UPS SRT 6000VA", "SRT6KXLI", "APC by Schneider Electric"],
    ["ViewFinity S6 27-inch", "S27A600", "Samsung"],
    ["LaserJet Enterprise M507dn", "1PV87A", "HP"],
  ] as const;
  const modelIdByName = new Map<string, string>();
  for (const [name, modelNumber, manufacturer] of modelDefinitions) {
    const [row] = await db
      .insert(assetModels)
      .values({
        tenantId: tenant.id,
        manufacturerId: required(
          manufacturerIdByName.get(manufacturer),
          `manufacturer ${manufacturer}`,
        ),
        name,
        modelNumber,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [assetModels.tenantId, assetModels.name],
        set: {
          manufacturerId: required(
            manufacturerIdByName.get(manufacturer),
            `manufacturer ${manufacturer}`,
          ),
          modelNumber,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed model ${name}.`);
    modelIdByName.set(name, row.id);
  }

  const assetDefinitions = [
    [
      "BLR-LT-2401",
      "DL7440-9K2M01",
      "Finance Manager Laptop",
      "laptop",
      "Latitude 7440",
      "in_use",
      "good",
      "neha.kapoor@northstar.example",
      "BLR-HQ",
      "FIN-301",
      undefined,
      undefined,
      {
        processor: "Intel Core i7-1365U",
        memory_gb: 32,
        storage: "1 TB NVMe SSD",
        os: "Windows 11 Enterprise",
      },
    ],
    [
      "BLR-LT-2402",
      "DL7440-9K2M02",
      "IT Asset Manager Laptop",
      "laptop",
      "Latitude 7440",
      "in_use",
      "good",
      "meera.iyer@northstar.example",
      "BLR-HQ",
      "IT-STORE",
      undefined,
      undefined,
      {
        processor: "Intel Core i7-1365U",
        memory_gb: 32,
        storage: "1 TB NVMe SSD",
        os: "Windows 11 Enterprise",
      },
    ],
    [
      "BLR-LT-2403",
      "LNT14-4A8P11",
      "Infrastructure Engineer Laptop",
      "laptop",
      "ThinkPad T14 Gen 4",
      "in_use",
      "good",
      "vikram.singh@northstar.example",
      "BLR-HQ",
      "NOC-501",
      undefined,
      undefined,
      {
        processor: "Intel Core i7-1365U",
        memory_gb: 32,
        storage: "512 GB NVMe SSD",
        os: "Ubuntu 24.04 LTS",
      },
    ],
    [
      "BLR-LT-2404",
      "APL-MBP14-C9Q21",
      "Director Technology MacBook",
      "laptop",
      "MacBook Pro 14-inch",
      "in_use",
      "excellent",
      "rahul.mehta@northstar.example",
      "BLR-HQ",
      "NOC-501",
      undefined,
      undefined,
      { processor: "Apple M3 Pro", memory_gb: 36, storage: "1 TB SSD", os: "macOS" },
    ],
    [
      "BLR-LT-2501",
      "LNT14-5B9R01",
      "Service Desk Spare Laptop 01",
      "laptop",
      "ThinkPad T14 Gen 4",
      "in_stock",
      "new",
      undefined,
      "BLR-HQ",
      "IT-STORE",
      undefined,
      "BLR-LAPTOPS",
      {
        processor: "Intel Core i5-1345U",
        memory_gb: 16,
        storage: "512 GB NVMe SSD",
        os: "Windows 11 Enterprise",
      },
    ],
    [
      "BLR-LT-2502",
      "LNT14-5B9R02",
      "Service Desk Spare Laptop 02",
      "laptop",
      "ThinkPad T14 Gen 4",
      "in_stock",
      "new",
      undefined,
      "BLR-HQ",
      "IT-STORE",
      undefined,
      "BLR-LAPTOPS",
      {
        processor: "Intel Core i5-1345U",
        memory_gb: 16,
        storage: "512 GB NVMe SSD",
        os: "Windows 11 Enterprise",
      },
    ],
    [
      "BLR-LT-2503",
      "LNT14-5B9R03",
      "Service Desk Spare Laptop 03",
      "laptop",
      "ThinkPad T14 Gen 4",
      "in_stock",
      "new",
      undefined,
      "BLR-HQ",
      "IT-STORE",
      undefined,
      "BLR-LAPTOPS",
      {
        processor: "Intel Core i5-1345U",
        memory_gb: 16,
        storage: "512 GB NVMe SSD",
        os: "Windows 11 Enterprise",
      },
    ],
    [
      "MUM-LT-2401",
      "DL7440-7H1T01",
      "Mumbai Support Laptop",
      "laptop",
      "Latitude 7440",
      "in_use",
      "good",
      "ananya.rao@northstar.example",
      "MUM-BR",
      "MUM-IT",
      undefined,
      undefined,
      {
        processor: "Intel Core i7-1365U",
        memory_gb: 16,
        storage: "512 GB NVMe SSD",
        os: "Windows 11 Enterprise",
      },
    ],
    [
      "BLR-DT-2301",
      "OPT7010-3D1101",
      "Asset Store Workstation",
      "desktop",
      "OptiPlex 7010",
      "in_service",
      "good",
      "arjun.nair@northstar.example",
      "BLR-HQ",
      "IT-STORE",
      undefined,
      undefined,
      { processor: "Intel Core i5-13500", memory_gb: 16 },
    ],
    [
      "HYD-SRV-2301",
      "R760-IND-230101",
      "Virtualization Host 01",
      "server",
      "PowerEdge R760",
      "in_service",
      "good",
      undefined,
      "HYD-DR",
      "DATA-A",
      "DC-R01",
      undefined,
      { rack_units: 2, cpu: "2 x Intel Xeon Gold 5416S", memory_gb: 512, cluster: "HYD-VM-CL01" },
    ],
    [
      "HYD-SRV-2302",
      "R760-IND-230102",
      "Virtualization Host 02",
      "server",
      "PowerEdge R760",
      "in_service",
      "good",
      undefined,
      "HYD-DR",
      "DATA-A",
      "DC-R01",
      undefined,
      { rack_units: 2, cpu: "2 x Intel Xeon Gold 5416S", memory_gb: 512, cluster: "HYD-VM-CL01" },
    ],
    [
      "HYD-SRV-2201",
      "HPE-DL380-220011",
      "Backup Repository Server",
      "server",
      "ProLiant DL380 Gen11",
      "maintenance",
      "fair",
      undefined,
      "HYD-DR",
      "DATA-A",
      "DC-R01",
      undefined,
      {
        rack_units: 2,
        cpu: "2 x Intel Xeon Silver 4410Y",
        memory_gb: 256,
        role: "Backup repository",
      },
    ],
    [
      "BLR-NW-2201",
      "C9300-FOC-220101",
      "Bengaluru Core Switch 01",
      "switch",
      "Catalyst 9300-48P",
      "in_service",
      "good",
      undefined,
      "BLR-HQ",
      "NOC-501",
      "NOC-R01",
      undefined,
      { port_count: 48, management_ip: "10.20.0.11", stack_member: 1 },
    ],
    [
      "BLR-NW-2202",
      "C9300-FOC-220102",
      "Bengaluru Core Switch 02",
      "switch",
      "Catalyst 9300-48P",
      "in_service",
      "good",
      undefined,
      "BLR-HQ",
      "NOC-501",
      "NOC-R01",
      undefined,
      { port_count: 48, management_ip: "10.20.0.12", stack_member: 2 },
    ],
    [
      "MUM-NW-2301",
      "C9300-MUM-230101",
      "Mumbai Access Switch",
      "switch",
      "Catalyst 9300-48P",
      "in_service",
      "good",
      undefined,
      "MUM-BR",
      "MUM-IT",
      "MUM-R01",
      undefined,
      { port_count: 48, management_ip: "10.30.0.11" },
    ],
    [
      "HYD-FW-2301",
      "FG100F-HYD-2301",
      "DR Perimeter Firewall",
      "firewall",
      "FortiGate 100F",
      "in_service",
      "good",
      undefined,
      "HYD-DR",
      "DATA-A",
      "DC-R02",
      undefined,
      { ha_role: "primary", firmware: "FortiOS 7.4" },
    ],
    [
      "BLR-AP-2401",
      "C9120-BLR-240101",
      "Technology Floor Wireless AP",
      "access-point",
      "Catalyst 9120AXI",
      "in_service",
      "good",
      undefined,
      "BLR-HQ",
      "NOC-501",
      undefined,
      undefined,
      { controller: "WLC-BLR-01", channel_plan: "automatic" },
    ],
    [
      "HYD-UPS-2201",
      "APC-SRT6K-22011",
      "Compute Rack UPS",
      "ups",
      "Smart-UPS SRT 6000VA",
      "in_service",
      "good",
      undefined,
      "HYD-DR",
      "DATA-A",
      "DC-R01",
      undefined,
      { capacity_va: 6000, battery_health: "92%" },
    ],
    [
      "BLR-MON-2401",
      "SAM-S27-240101",
      "Finance Manager Monitor",
      "monitor",
      "ViewFinity S6 27-inch",
      "in_use",
      "good",
      "neha.kapoor@northstar.example",
      "BLR-HQ",
      "FIN-301",
      undefined,
      undefined,
      { resolution: "2560x1440", panel: "IPS" },
    ],
    [
      "BLR-PRN-2201",
      "HP-M507-220101",
      "Corporate Services Printer",
      "printer",
      "LaserJet Enterprise M507dn",
      "in_service",
      "fair",
      undefined,
      "BLR-HQ",
      "FIN-301",
      undefined,
      undefined,
      { network_ip: "10.20.30.25", duplex: true },
    ],
  ] as const;
  const assetIdByTag = new Map<string, string>();
  for (const [
    assetTag,
    serialNumber,
    name,
    typeKey,
    modelName,
    status,
    condition,
    custodianEmail,
    siteCode,
    roomCode,
    rackCode,
    binCode,
    customFieldsValue,
  ] of assetDefinitions) {
    const siteId = required(siteIdByCode.get(siteCode), `site ${siteCode}`);
    const building = buildingDefinitions.find((item) => item.site === siteCode);
    const floor = roomDefinitions.find((item) => item.code === roomCode)?.floor;
    const buildingId = building ? buildingIdByCode.get(building.code) : undefined;
    const floorId = floor ? floorIdByKey.get(floor) : undefined;
    const [row] = await db
      .insert(assets)
      .values({
        tenantId: tenant.id,
        assetTypeId: required(typeIdByKey.get(typeKey), `type ${typeKey}`),
        modelId: required(modelIdByName.get(modelName), `model ${modelName}`),
        vendorId: vendorIdByName.get(
          typeKey === "firewall" ? "NetSecure Systems" : "Redington India Limited",
        ),
        siteId,
        buildingId,
        floorId,
        roomId: roomIdByCode.get(roomCode),
        rackId: rackCode ? rackIdByCode.get(rackCode) : undefined,
        binId: binCode ? binIdByCode.get(binCode) : undefined,
        custodianUserId: custodianEmail ? userIdByEmail.get(custodianEmail) : undefined,
        assetTag,
        serialNumber,
        name,
        status,
        condition,
        customFields: customFieldsValue,
      })
      .onConflictDoUpdate({
        target: [assets.tenantId, assets.assetTag],
        set: {
          assetTypeId: required(typeIdByKey.get(typeKey), `type ${typeKey}`),
          modelId: required(modelIdByName.get(modelName), `model ${modelName}`),
          siteId,
          buildingId,
          floorId,
          roomId: roomIdByCode.get(roomCode),
          rackId: rackCode ? rackIdByCode.get(rackCode) : null,
          binId: binCode ? binIdByCode.get(binCode) : null,
          custodianUserId: custodianEmail ? userIdByEmail.get(custodianEmail) : null,
          serialNumber,
          name,
          status,
          condition,
          customFields: customFieldsValue,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed asset ${assetTag}.`);
    assetIdByTag.set(assetTag, row.id);
    for (const [identifierType, identifierValue] of [
      ["qr", `custivio:${assetTag}`],
      ["barcode", assetTag],
    ] as const) {
      await db
        .insert(assetIdentifiers)
        .values({ tenantId: tenant.id, assetId: row.id, identifierType, identifierValue })
        .onConflictDoUpdate({
          target: [
            assetIdentifiers.tenantId,
            assetIdentifiers.identifierType,
            assetIdentifiers.identifierValue,
          ],
          set: { assetId: row.id, updatedAt: new Date() },
        });
    }
    await insertLifecycleEventOnce({
      tenantId: tenant.id,
      assetId: row.id,
      actorUserId: assetManagerId,
      eventType: "asset.registered",
      toStatus: status,
      metadata: { source: demoSource, serialNumber, siteCode },
    });
  }

  for (const [assetTag, assignedEmail, note] of [
    [
      "BLR-LT-2401",
      "neha.kapoor@northstar.example",
      "Assigned for finance operations and statutory reporting.",
    ],
    ["BLR-LT-2402", "meera.iyer@northstar.example", "Assigned to IT asset management lead."],
    [
      "BLR-LT-2403",
      "vikram.singh@northstar.example",
      "Assigned for infrastructure administration.",
    ],
    ["BLR-LT-2404", "rahul.mehta@northstar.example", "Executive technology workstation."],
    ["MUM-LT-2401", "ananya.rao@northstar.example", "Assigned for Mumbai service-desk support."],
    ["BLR-DT-2301", "arjun.nair@northstar.example", "Shared asset-store operations workstation."],
    ["BLR-MON-2401", "neha.kapoor@northstar.example", "Assigned with finance laptop BLR-LT-2401."],
  ] as const) {
    const assetId = required(assetIdByTag.get(assetTag), `asset ${assetTag}`);
    const assignedToUserId = required(userIdByEmail.get(assignedEmail), `user ${assignedEmail}`);
    const [existing] = await db
      .select({ id: assetCustodyAssignments.id })
      .from(assetCustodyAssignments)
      .where(
        and(
          eq(assetCustodyAssignments.tenantId, tenant.id),
          eq(assetCustodyAssignments.assetId, assetId),
          eq(assetCustodyAssignments.assignedToUserId, assignedToUserId),
          eq(assetCustodyAssignments.status, "active"),
        ),
      )
      .limit(1);
    if (!existing)
      await db.insert(assetCustodyAssignments).values({
        tenantId: tenant.id,
        assetId,
        assignedToUserId,
        assignedByUserId: assetManagerId,
        status: "active",
        notes: note,
      });
  }

  const transferDefinitions = [
    {
      asset: "BLR-LT-2501",
      from: undefined,
      to: "sana.khan@northstar.example",
      requestedBy: assetManagerId,
      status: "pending",
      reason: "New starter device allocation for People Operations.",
    },
    {
      asset: "BLR-LT-2403",
      from: "vikram.singh@northstar.example",
      to: "ananya.rao@northstar.example",
      requestedBy: assetManagerId,
      status: "approved",
      reason: "Temporary assignment for network rollout support.",
      decision: "Approved for the planned two-week support window.",
    },
  ] as const;
  for (const definition of transferDefinitions) {
    const assetId = required(assetIdByTag.get(definition.asset), `asset ${definition.asset}`);
    const toCustodianUserId = required(userIdByEmail.get(definition.to), `user ${definition.to}`);
    const [existing] = await db
      .select({ id: assetTransferRequests.id })
      .from(assetTransferRequests)
      .where(
        and(
          eq(assetTransferRequests.tenantId, tenant.id),
          eq(assetTransferRequests.assetId, assetId),
          eq(assetTransferRequests.toCustodianUserId, toCustodianUserId),
          eq(assetTransferRequests.status, definition.status),
        ),
      )
      .limit(1);
    if (!existing)
      await db.insert(assetTransferRequests).values({
        tenantId: tenant.id,
        assetId,
        fromCustodianUserId: definition.from ? userIdByEmail.get(definition.from) : undefined,
        toCustodianUserId,
        requestedByUserId: definition.requestedBy,
        decidedByUserId: definition.status === "approved" ? approverId : undefined,
        status: definition.status,
        reason: definition.reason,
        decisionNote: "decision" in definition ? definition.decision : undefined,
        decidedAt:
          definition.status === "approved" ? new Date("2026-09-28T10:30:00.000Z") : undefined,
      });
  }

  const maintenanceDefinitions = [
    {
      asset: "HYD-SRV-2201",
      issue: "RAID controller reports intermittent cache battery fault",
      status: "in_progress",
      priority: "high",
      resolution: undefined,
      downtime: 45,
    },
    {
      asset: "BLR-PRN-2201",
      issue: "Paper pickup rollers slipping during duplex print jobs",
      status: "open",
      priority: "medium",
      resolution: undefined,
      downtime: 0,
    },
    {
      asset: "BLR-LT-2401",
      issue: "USB-C dock firmware caused intermittent display blanking",
      status: "resolved",
      priority: "low",
      resolution: "Updated dock firmware and verified dual-monitor output.",
      downtime: 20,
    },
  ] as const;
  for (const definition of maintenanceDefinitions) {
    const assetId = required(assetIdByTag.get(definition.asset), `asset ${definition.asset}`);
    const [found] = await db
      .select()
      .from(assetMaintenanceTickets)
      .where(
        and(
          eq(assetMaintenanceTickets.tenantId, tenant.id),
          eq(assetMaintenanceTickets.assetId, assetId),
          eq(assetMaintenanceTickets.issueSummary, definition.issue),
        ),
      )
      .limit(1);
    const [ticket] = found
      ? [found]
      : await db
          .insert(assetMaintenanceTickets)
          .values({
            tenantId: tenant.id,
            assetId,
            openedByUserId: assetManagerId,
            assignedToUserId: technicianId,
            status: definition.status,
            priority: definition.priority,
            issueSummary: definition.issue,
            resolutionSummary: definition.resolution,
            resolvedAt:
              definition.status === "resolved" ? new Date("2026-09-18T12:10:00.000Z") : undefined,
            downtimeMinutes: definition.downtime,
          })
          .returning();
    if (!ticket) throw new Error(`Failed to seed maintenance ticket for ${definition.asset}.`);
    const [event] = await db
      .select({ id: assetMaintenanceEvents.id })
      .from(assetMaintenanceEvents)
      .where(
        and(
          eq(assetMaintenanceEvents.tenantId, tenant.id),
          eq(assetMaintenanceEvents.ticketId, ticket.id),
          eq(assetMaintenanceEvents.eventType, "ticket.opened"),
        ),
      )
      .limit(1);
    if (!event)
      await db.insert(assetMaintenanceEvents).values({
        tenantId: tenant.id,
        ticketId: ticket.id,
        actorUserId: assetManagerId,
        eventType: "ticket.opened",
        note: `Service request opened for ${definition.asset}.`,
        metadata: { source: demoSource },
      });
  }

  for (const [assetTag, provider, contractNumber, startsAt, endsAt, status] of [
    [
      "BLR-LT-2401",
      "Dell Technologies",
      "DELL-PROSUP-BLR-2024-011",
      "2024-04-15",
      "2027-04-14",
      "active",
    ],
    [
      "BLR-LT-2402",
      "Dell Technologies",
      "DELL-PROSUP-BLR-2024-012",
      "2024-04-15",
      "2027-04-14",
      "active",
    ],
    [
      "HYD-SRV-2301",
      "Dell Technologies",
      "DELL-PROSUP-HYD-2023-101",
      "2023-08-01",
      "2028-07-31",
      "active",
    ],
    [
      "HYD-SRV-2302",
      "Dell Technologies",
      "DELL-PROSUP-HYD-2023-102",
      "2023-08-01",
      "2028-07-31",
      "active",
    ],
    [
      "BLR-NW-2201",
      "Cisco Smart Net",
      "CS-SNT-BLR-2022-031",
      "2022-11-10",
      "2026-11-09",
      "expiring",
    ],
  ] as const) {
    const assetId = required(assetIdByTag.get(assetTag), `asset ${assetTag}`);
    const [existing] = await db
      .select({ id: assetWarranties.id })
      .from(assetWarranties)
      .where(
        and(
          eq(assetWarranties.tenantId, tenant.id),
          eq(assetWarranties.assetId, assetId),
          eq(assetWarranties.contractNumber, contractNumber),
        ),
      )
      .limit(1);
    if (!existing)
      await db.insert(assetWarranties).values({
        tenantId: tenant.id,
        assetId,
        provider,
        contractNumber,
        startsAt: new Date(`${startsAt}T00:00:00.000Z`),
        endsAt: new Date(`${endsAt}T00:00:00.000Z`),
        status,
        notes: "Vendor support entitlement recorded during asset onboarding.",
      });
  }

  const unitDefinitions = [
    ["EA", "Each"],
    ["BOX", "Box"],
    ["MTR", "Metre"],
    ["PKT", "Packet"],
  ] as const;
  const unitIdByCode = new Map<string, string>();
  for (const [code, name] of unitDefinitions) {
    const [row] = await db
      .insert(stockUnits)
      .values({ tenantId: tenant.id, code, name, status: "active" })
      .onConflictDoUpdate({
        target: [stockUnits.tenantId, stockUnits.code],
        set: { name, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error(`Failed to seed stock unit ${code}.`);
    unitIdByCode.set(code, row.id);
  }

  const stockDefinitions = [
    ["CAB-CAT6-1M-BLU", "CAT6 Patch Cable 1m - Blue", "cable", "EA", 40, 180, "BLR-ACCESSORIES"],
    ["CAB-CAT6-3M-BLK", "CAT6 Patch Cable 3m - Black", "cable", "EA", 25, 76, "BLR-ACCESSORIES"],
    ["ADP-USBC-65W", "USB-C 65W Power Adapter", "accessory", "EA", 10, 18, "BLR-ACCESSORIES"],
    ["DOCK-USBC-WD19", "USB-C Business Dock", "accessory", "EA", 8, 13, "BLR-ACCESSORIES"],
    ["SSD-NVME-1TB", "1 TB NVMe Enterprise SSD", "component", "EA", 6, 9, "BLR-SPARES"],
    ["MEM-DDR5-32GB", "32 GB DDR5 ECC Memory Module", "component", "EA", 8, 14, "BLR-SPARES"],
    ["SFP-10G-SR", "10 GbE Short-Range SFP+ Transceiver", "component", "EA", 12, 7, "BLR-SPARES"],
    ["TONER-HP-89A", "HP 89A Black Toner Cartridge", "consumable", "EA", 5, 4, "BLR-SPARES"],
    [
      "LBL-ASSET-50X25",
      "Tamper-Evident Asset Label 50x25 mm",
      "consumable",
      "PKT",
      3,
      12,
      "BLR-ACCESSORIES",
    ],
    ["BAT-APC-SRT", "APC SRT Replacement Battery Module", "spare", "EA", 2, 3, "BLR-SPARES"],
  ] as const;
  const stockIdBySku = new Map<string, string>();
  for (const [
    sku,
    name,
    itemType,
    unitCode,
    threshold,
    quantity,
    locationKey,
  ] of stockDefinitions) {
    const [item] = await db
      .insert(stockItems)
      .values({
        tenantId: tenant.id,
        unitId: required(unitIdByCode.get(unitCode), `unit ${unitCode}`),
        sku,
        name,
        itemType,
        lowStockThreshold: threshold,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [stockItems.tenantId, stockItems.sku],
        set: {
          unitId: required(unitIdByCode.get(unitCode), `unit ${unitCode}`),
          name,
          itemType,
          lowStockThreshold: threshold,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!item) throw new Error(`Failed to seed stock item ${sku}.`);
    stockIdBySku.set(sku, item.id);
    await db
      .insert(stockBalances)
      .values({ tenantId: tenant.id, stockItemId: item.id, locationKey, quantityOnHand: quantity })
      .onConflictDoUpdate({
        target: [stockBalances.tenantId, stockBalances.stockItemId, stockBalances.locationKey],
        set: { quantityOnHand: quantity, updatedAt: new Date() },
      });
    await db
      .insert(stockLowStockRules)
      .values({ tenantId: tenant.id, stockItemId: item.id, locationKey, threshold })
      .onConflictDoUpdate({
        target: [
          stockLowStockRules.tenantId,
          stockLowStockRules.stockItemId,
          stockLowStockRules.locationKey,
        ],
        set: { threshold, updatedAt: new Date() },
      });
    await db
      .insert(stockLedgerEntries)
      .values({
        tenantId: tenant.id,
        stockItemId: item.id,
        movementType: "receive",
        quantity,
        toLocationKey: locationKey,
        referenceId: `PO-2026-${sku}`,
        idempotencyKey: `showcase-opening-${sku}`,
        metadata: { source: demoSource, purchaseOrder: `PO-2026-${sku}` },
        createdByUserId: inventoryUserId,
      })
      .onConflictDoUpdate({
        target: [stockLedgerEntries.tenantId, stockLedgerEntries.idempotencyKey],
        set: {
          quantity,
          toLocationKey: locationKey,
          metadata: { source: demoSource, purchaseOrder: `PO-2026-${sku}` },
          createdByUserId: inventoryUserId,
        },
      });
  }

  const sfpId = required(stockIdBySku.get("SFP-10G-SR"), "SFP stock item");
  const [existingAdjustment] = await db
    .select({ id: stockAdjustments.id })
    .from(stockAdjustments)
    .where(
      and(
        eq(stockAdjustments.tenantId, tenant.id),
        eq(stockAdjustments.stockItemId, sfpId),
        eq(stockAdjustments.reason, "Cycle count correction after September rack audit"),
      ),
    )
    .limit(1);
  if (!existingAdjustment)
    await db.insert(stockAdjustments).values({
      tenantId: tenant.id,
      stockItemId: sfpId,
      locationKey: "BLR-SPARES",
      quantityDelta: -1,
      reason: "Cycle count correction after September rack audit",
      createdByUserId: inventoryUserId,
    });
  const cableId = required(stockIdBySku.get("CAB-CAT6-3M-BLK"), "cable stock item");
  const [existingStockTransfer] = await db
    .select({ id: stockTransfers.id })
    .from(stockTransfers)
    .where(
      and(
        eq(stockTransfers.tenantId, tenant.id),
        eq(stockTransfers.stockItemId, cableId),
        eq(stockTransfers.fromLocationKey, "BLR-ACCESSORIES"),
        eq(stockTransfers.toLocationKey, "MUM-STOCK"),
      ),
    )
    .limit(1);
  if (!existingStockTransfer)
    await db.insert(stockTransfers).values({
      tenantId: tenant.id,
      stockItemId: cableId,
      quantity: 20,
      fromLocationKey: "BLR-ACCESSORIES",
      toLocationKey: "MUM-STOCK",
      status: "completed",
      createdByUserId: inventoryUserId,
    });

  const campaignDefinitions = [
    {
      name: "FY 2026 Q3 Bengaluru Asset Verification",
      scope: "BLR-HQ",
      status: "in_progress",
      plannedAt: "2026-10-01",
      startedAt: "2026-10-03",
    },
    {
      name: "FY 2026 Data Centre Compliance Audit",
      scope: "HYD-DR",
      status: "completed",
      plannedAt: "2026-08-01",
      startedAt: "2026-08-04",
      completedAt: "2026-08-06",
    },
  ] as const;
  const campaignIdByName = new Map<string, string>();
  for (const definition of campaignDefinitions) {
    const [found] = await db
      .select()
      .from(auditCampaigns)
      .where(and(eq(auditCampaigns.tenantId, tenant.id), eq(auditCampaigns.name, definition.name)))
      .limit(1);
    const [campaign] = found
      ? [found]
      : await db
          .insert(auditCampaigns)
          .values({
            tenantId: tenant.id,
            name: definition.name,
            scope: definition.scope,
            status: definition.status,
            plannedAt: new Date(`${definition.plannedAt}T00:00:00.000Z`),
            startedAt: new Date(`${definition.startedAt}T09:00:00.000Z`),
            completedAt:
              "completedAt" in definition
                ? new Date(`${definition.completedAt}T17:30:00.000Z`)
                : undefined,
            createdByUserId: auditorId,
          })
          .returning();
    if (!campaign) throw new Error(`Failed to seed campaign ${definition.name}.`);
    campaignIdByName.set(definition.name, campaign.id);
  }

  for (const [campaignName, assetTag, resultStatus, notes] of [
    [
      "FY 2026 Q3 Bengaluru Asset Verification",
      "BLR-LT-2401",
      "found",
      "Asset tag and serial number matched the finance custody record.",
    ],
    [
      "FY 2026 Q3 Bengaluru Asset Verification",
      "BLR-LT-2402",
      "found",
      "Device verified with the assigned custodian.",
    ],
    [
      "FY 2026 Q3 Bengaluru Asset Verification",
      "BLR-PRN-2201",
      "condition_issue",
      "Printer is operational but pickup rollers require replacement.",
    ],
    [
      "FY 2026 Data Centre Compliance Audit",
      "HYD-SRV-2301",
      "found",
      "Rack position, serial number and support contract verified.",
    ],
    [
      "FY 2026 Data Centre Compliance Audit",
      "HYD-SRV-2302",
      "found",
      "Rack position, serial number and support contract verified.",
    ],
    [
      "FY 2026 Data Centre Compliance Audit",
      "HYD-UPS-2201",
      "found",
      "Battery health reading recorded at 92 percent.",
    ],
  ] as const) {
    const campaignId = required(campaignIdByName.get(campaignName), `campaign ${campaignName}`);
    const assetId = required(assetIdByTag.get(assetTag), `asset ${assetTag}`);
    const [scan] = await db
      .insert(auditScanResults)
      .values({
        tenantId: tenant.id,
        campaignId,
        assetId,
        scanCode: `custivio:${assetTag}`,
        resultStatus,
        notes,
        scannedByUserId: auditorId,
      })
      .onConflictDoUpdate({
        target: [auditScanResults.campaignId, auditScanResults.scanCode],
        set: { resultStatus, notes, scannedByUserId: auditorId, updatedAt: new Date() },
      })
      .returning();
    if (resultStatus === "condition_issue" && scan) {
      const description =
        "Printer pickup rollers show wear and should be replaced during the next maintenance window.";
      const [finding] = await db
        .select({ id: auditFindings.id })
        .from(auditFindings)
        .where(
          and(
            eq(auditFindings.tenantId, tenant.id),
            eq(auditFindings.campaignId, campaignId),
            eq(auditFindings.description, description),
          ),
        )
        .limit(1);
      if (!finding)
        await db.insert(auditFindings).values({
          tenantId: tenant.id,
          campaignId,
          scanResultId: scan.id,
          assetId,
          severity: "medium",
          status: "open",
          description,
        });
    }
  }

  const [importJob] = await db
    .insert(importJobs)
    .values({
      tenantId: tenant.id,
      importType: "assets",
      status: "completed",
      originalFilename: "bengaluru-laptop-receipt-oct-2026.csv",
      totalRows: 3,
      processedRows: 3,
      failedRows: 0,
      idempotencyKey: "showcase-import-assets-2026-10",
      completedAt: new Date("2026-10-08T11:20:00.000Z"),
      createdByUserId: assetManagerId,
      metadata: {
        source: demoSource,
        purchaseOrder: "PO-NSD-2026-1048",
        supplier: "Redington India Limited",
      },
    })
    .onConflictDoUpdate({
      target: [importJobs.tenantId, importJobs.idempotencyKey],
      set: {
        status: "completed",
        totalRows: 3,
        processedRows: 3,
        failedRows: 0,
        completedAt: new Date("2026-10-08T11:20:00.000Z"),
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!importJob) throw new Error("Failed to seed showcase import job.");
  for (const [rowNumber, assetTag, serialNumber] of [
    [1, "BLR-LT-2501", "LNT14-5B9R01"],
    [2, "BLR-LT-2502", "LNT14-5B9R02"],
    [3, "BLR-LT-2503", "LNT14-5B9R03"],
  ] as const) {
    await db
      .insert(importJobRows)
      .values({
        tenantId: tenant.id,
        importJobId: importJob.id,
        rowNumber,
        status: "processed",
        diagnostics: [],
        payload: { assetTag, serialNumber, assetType: "laptop", site: "BLR-HQ" },
      })
      .onConflictDoUpdate({
        target: [importJobRows.importJobId, importJobRows.rowNumber],
        set: {
          status: "processed",
          diagnostics: [],
          payload: { assetTag, serialNumber, assetType: "laptop", site: "BLR-HQ" },
        },
      });
  }

  const exportBody = JSON.stringify({
    generatedFor: tenant.name,
    generatedAt: "2026-10-10T09:30:00.000Z",
    recordCount: assetDefinitions.length,
    note: "Showcase inventory export metadata; generate a fresh API export for download.",
  });
  await db
    .insert(exportJobs)
    .values({
      tenantId: tenant.id,
      exportType: "assets",
      status: "pending",
      filename: "northstar-asset-register-2026-10.json",
      objectKey: `exports/${tenant.id}/showcase-asset-register.json`,
      contentLength: exportBody.length,
      checksumSha256: createHash("sha256").update(exportBody).digest("hex"),
      filters: { site: "BLR-HQ", status: ["in_use", "in_service", "in_stock"] },
      idempotencyKey: "showcase-export-assets-2026-10",
      createdByUserId: assetManagerId,
    })
    .onConflictDoUpdate({
      target: [exportJobs.tenantId, exportJobs.idempotencyKey],
      set: {
        status: "pending",
        filters: { site: "BLR-HQ", status: ["in_use", "in_service", "in_stock"] },
        updatedAt: new Date(),
      },
    });

  for (const [module, key, name, filters] of [
    [
      "assets",
      "active-bengaluru-assets",
      "Active Bengaluru Assets",
      { siteCode: "BLR-HQ", status: ["in_use", "in_service", "in_stock"] },
    ],
    [
      "assets",
      "warranty-expiring-90-days",
      "Warranties Expiring in 90 Days",
      { warrantyWindowDays: 90, warrantyStatus: "expiring" },
    ],
    ["stock", "below-reorder-level", "Stock Below Reorder Level", { belowThreshold: true }],
    [
      "maintenance",
      "open-high-priority",
      "Open High-Priority Maintenance",
      { status: ["open", "in_progress"], priority: "high" },
    ],
  ] as const) {
    await db
      .insert(savedFilters)
      .values({ tenantId: tenant.id, module, key, name, filters, createdByUserId: assetManagerId })
      .onConflictDoUpdate({
        target: [savedFilters.tenantId, savedFilters.module, savedFilters.key],
        set: { name, filters, createdByUserId: assetManagerId, updatedAt: new Date() },
      });
  }

  const [seedLog] = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenant.id),
        eq(auditLogs.action, "system.seed.showcase"),
        eq(auditLogs.entityType, "tenant"),
      ),
    )
    .limit(1);
  if (!seedLog)
    await db.insert(auditLogs).values({
      tenantId: tenant.id,
      actorUserId: adminUserId,
      action: "system.seed.showcase",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: {
        source: demoSource,
        assets: assetDefinitions.length,
        stockItems: stockDefinitions.length,
        users: userDefinitions.length,
      },
    });

  const summaryTables = {
    users,
    assets,
    stockItems,
    assetMaintenanceTickets,
    auditCampaigns,
    importJobs,
    exportJobs,
  };
  const summary: Record<string, number> = {};
  for (const [name, table] of Object.entries(summaryTables)) {
    const [row] = await db
      .select({ value: count() })
      .from(table)
      .where(eq(table.tenantId, tenant.id));
    summary[name] = row?.value ?? 0;
  }
  return summary;
}

async function runShowcaseSeedCli(): Promise<void> {
  try {
    const summary = await seedShowcaseDatabase();
    process.stdout.write(`${JSON.stringify({ ok: true, source: demoSource, summary }, null, 2)}\n`);
  } finally {
    await closeDatabaseConnections();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runShowcaseSeedCli();
}
