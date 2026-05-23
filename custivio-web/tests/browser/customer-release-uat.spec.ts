import { expect, test, type Locator, type Page } from "@playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3002";

const personas = [
  {
    key: "administrator",
    label: "Super/Admin",
    email: process.env.E2E_ADMIN_EMAIL ?? process.env.UAT_ADMIN_EMAIL,
    allowed: [
      "/",
      "/assets",
      "/catalog",
      "/stock",
      "/custody",
      "/maintenance",
      "/audit-reports",
      "/users",
      "/roles",
      "/assignments",
      "/status",
    ],
    forbidden: [],
  },
  {
    key: "asset_manager",
    label: "Asset Manager",
    email: process.env.E2E_MANAGER_EMAIL ?? process.env.UAT_MANAGER_EMAIL,
    allowed: ["/", "/assets", "/catalog", "/stock", "/custody", "/maintenance", "/status"],
    forbidden: ["/users", "/roles", "/assignments", "/audit-reports"],
  },
  {
    key: "inventory_clerk",
    label: "Store/Inventory User",
    email: process.env.E2E_STORE_EMAIL ?? process.env.UAT_STORE_EMAIL,
    allowed: ["/", "/assets", "/stock", "/custody", "/status"],
    forbidden: ["/users", "/roles", "/assignments", "/catalog", "/audit-reports"],
  },
  {
    key: "technician",
    label: "Technician",
    email: process.env.E2E_TECHNICIAN_EMAIL ?? process.env.UAT_TECHNICIAN_EMAIL,
    allowed: ["/", "/assets", "/stock", "/custody", "/maintenance", "/status"],
    forbidden: ["/users", "/roles", "/assignments", "/catalog", "/audit-reports"],
  },
  {
    key: "manager_approver",
    label: "Manager/Approver",
    email: process.env.E2E_APPROVER_EMAIL ?? process.env.UAT_APPROVER_EMAIL,
    allowed: ["/", "/assets", "/stock", "/custody", "/maintenance", "/status"],
    forbidden: ["/users", "/roles", "/assignments", "/catalog", "/audit-reports"],
  },
  {
    key: "auditor",
    label: "Auditor",
    email: process.env.E2E_AUDITOR_EMAIL ?? process.env.UAT_AUDITOR_EMAIL,
    allowed: ["/", "/assets", "/stock", "/custody", "/maintenance", "/audit-reports", "/status"],
    forbidden: ["/users", "/roles", "/assignments", "/catalog"],
  },
  {
    key: "viewer",
    label: "Read-only Viewer",
    email: process.env.E2E_VIEWER_EMAIL ?? process.env.UAT_VIEWER_EMAIL,
    allowed: ["/", "/assets", "/stock", "/custody", "/maintenance", "/audit-reports", "/status"],
    forbidden: ["/users", "/roles", "/assignments", "/catalog"],
  },
] as const;

const routeHeadings = new Map<string, RegExp>([
  ["/", /welcome back/i],
  ["/assets", /asset registry/i],
  ["/catalog", /asset catalog/i],
  ["/stock", /stock/i],
  ["/custody", /custody/i],
  ["/maintenance", /maintenance/i],
  ["/audit-reports", /audit & reports/i],
  ["/users", /users/i],
  ["/roles", /roles/i],
  ["/assignments", /role assignments/i],
  ["/status", /system status/i],
]);

const uatPassword = process.env.E2E_PASSWORD ?? process.env.UAT_SEED_PASSWORD;

test.describe.configure({ mode: "serial" });

test.describe("Custivio customer-release browser UAT", () => {
  test.skip(!personas[0].email || !uatPassword, "Set UAT admin email and password envs.");

  test("admin can complete customer-critical mutation workflows", async ({ page }) => {
    test.setTimeout(420_000);

    const suffix = uniqueSuffix();
    const invitedEmail = `customer-browser-${suffix}@example.test`;
    const roleKey = `customer_browser_${suffix}`;
    const roleName = `Customer Browser Role ${suffix}`;
    const editedRoleName = `${roleName} Edited`;
    const categoryKey = `cust-cat-${suffix}`;
    const typeKey = `cust-type-${suffix}`;
    const customFieldKey = `cust-field-${suffix}`;
    const manufacturerName = `Custivio Manufacturer ${suffix}`;
    const modelName = `Custivio Model ${suffix}`;
    const vendorName = `Custivio Vendor ${suffix}`;
    const editedVendorName = `${vendorName} Edited`;
    const siteCode = `SITE-${suffix}`;
    const buildingCode = `BLDG-${suffix}`;
    const assetTag = `CR-${suffix}`;
    const stockSku = `CR-SKU-${suffix}`;
    const stockUnit = `CRU${suffix.slice(-4)}`;
    const campaignName = `Customer Audit ${suffix}`;
    const importFilename = `customer-import-${suffix}.json`;
    const filterName = `Customer Filter ${suffix}`;

    await login(page, personas[0].email!, uatPassword!);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    await createEditDisableAndResetUser(page, invitedEmail);
    await createEditAssignAndRemoveRole(page, roleKey, roleName, editedRoleName, invitedEmail);
    await createCatalogAndLocationRecords(page, {
      categoryKey,
      typeKey,
      customFieldKey,
      manufacturerName,
      modelName,
      vendorName,
      editedVendorName,
      siteCode,
      buildingCode,
    });
    await createEditAssetLifecycleAndAttachment(page, assetTag);
    await createStockItemAndMovements(page, stockSku, stockUnit);
    await completeCustodyAndTransferFlows(page, assetTag);
    await completeMaintenanceAndWarrantyFlows(page, assetTag, suffix);
    await completeAuditImportExportReportFlows(page, campaignName, importFilename, filterName);
    await signOut(page);
  });

  for (const persona of personas) {
    test(`${persona.label} persona access, denial, logout, and 401 behavior`, async ({ page }) => {
      test.skip(!persona.email || !uatPassword, `Set UAT env for ${persona.label}.`);

      await login(page, persona.email!, uatPassword!);

      for (const route of persona.allowed.slice(0, 4)) {
        await page.goto(route);
        await expect(page.getByRole("heading", { name: routeHeadings.get(route)! })).toBeVisible();
      }

      for (const route of persona.forbidden.slice(0, 2)) {
        await page.goto(route);
        await expect(page.getByText(/access denied/i).first()).toBeVisible();
      }

      if (persona.key !== "administrator") {
        const response = await page.request.post(`${apiBaseUrl}/api/admin/users`, {
          data: {
            email: `denied-${persona.key}-${uniqueSuffix()}@example.test`,
            displayName: "Denied Mutation",
            password: "DeniedMutationPass1!",
          },
        });
        expect(response.status()).toBe(403);
      }

      await signOut(page);
      await page.goto("/assets");
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

async function createEditDisableAndResetUser(page: Page, email: string) {
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();
  await page.getByRole("button", { name: /invite user/i }).click();
  let dialog = page.getByRole("dialog", { name: /invite user/i });
  await dialog.getByLabel(/display name/i).fill("Customer Browser User");
  await dialog.getByLabel(/^email$/i).fill(email);
  await dialog.getByLabel(/temporary password/i).fill("CustomerBrowserPass1!");
  await dialog.getByLabel(/job title/i).fill("Customer QA User");
  await dialog.getByRole("button", { name: /create user/i }).click();
  await expect(dialog).toBeHidden();

  await page.getByPlaceholder(/search by name or email/i).fill(email);
  let row = page.getByRole("row", { name: new RegExp(escapeRegex(email)) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /reset/i }).click();
  dialog = page.getByRole("dialog", { name: /reset password/i });
  await dialog.getByLabel(/new temporary password/i).fill("CustomerBrowserPass2!");
  await dialog.getByRole("button", { name: /reset password/i }).click();
  await expect(dialog).toBeHidden();

  row = page.getByRole("row", { name: new RegExp(escapeRegex(email)) });
  await row.getByRole("button", { name: /edit/i }).click();
  dialog = page.getByRole("dialog", { name: /edit user/i });
  await dialog.getByLabel(/job title/i).fill("Customer QA User Edited");
  await dialog.locator("select#status").selectOption("active");
  await dialog.getByRole("button", { name: /save user/i }).click();
  await expect(dialog).toBeHidden();

  row = page.getByRole("row", { name: new RegExp(escapeRegex(email)) });
  await row.getByRole("button", { name: /disable/i }).click();
  await expect(row).toContainText(/inactive/i);
}

async function createEditAssignAndRemoveRole(
  page: Page,
  roleKey: string,
  roleName: string,
  editedRoleName: string,
  userEmail: string,
) {
  await page.goto("/roles");
  await page.getByRole("button", { name: /new role/i }).click();
  let dialog = page.getByRole("dialog", { name: /new role/i });
  await dialog.getByLabel(/role key/i).fill(roleKey);
  await dialog.getByLabel(/^name$/i).fill(roleName);
  await dialog.getByLabel(/description/i).fill("Customer release browser role.");
  await dialog.getByLabel("assets.read").check();
  await dialog.getByLabel("inventory.read").check();
  await dialog.getByRole("button", { name: /create role/i }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: new RegExp(escapeRegex(roleName)) }).click();

  await page.getByRole("button", { name: /^edit$/i }).click();
  dialog = page.getByRole("dialog", { name: /edit role/i });
  await dialog.getByLabel(/^name$/i).fill(editedRoleName);
  await dialog.getByRole("button", { name: /save role/i }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: new RegExp(escapeRegex(editedRoleName)) }),
  ).toBeVisible();

  await page.goto("/assignments");
  await page.getByRole("button", { name: /assign role/i }).click();
  dialog = page.getByRole("dialog", { name: /assign role/i });
  await selectOptionByText(dialog.locator('select[name="userId"]'), userEmail);
  await selectOptionByText(dialog.locator('select[name="roleId"]'), editedRoleName);
  await dialog.getByRole("button", { name: /^assign$/i }).click();
  await expect(dialog).toBeHidden();

  const row = page.getByRole("row", { name: new RegExp(escapeRegex(userEmail)) });
  await expect(row).toBeVisible();
  await row.getByTitle("Remove assignment").click();
  await expect(row.getByTitle("Remove assignment")).toHaveCount(0);
}

async function createCatalogAndLocationRecords(
  page: Page,
  input: {
    categoryKey: string;
    typeKey: string;
    customFieldKey: string;
    manufacturerName: string;
    modelName: string;
    vendorName: string;
    editedVendorName: string;
    siteCode: string;
    buildingCode: string;
  },
) {
  await page.goto("/catalog");
  await createCatalogRecord(page, "categories", input.categoryKey, input.categoryKey);
  await createCatalogRecord(page, "types", input.typeKey, input.typeKey);
  await createCatalogRecord(page, "custom-fields", input.customFieldKey, input.customFieldKey);
  await createCatalogRecord(page, "manufacturers", input.manufacturerName, input.manufacturerName);
  await createCatalogRecord(page, "models", input.modelName, input.modelName);
  await createCatalogRecord(page, "vendors", input.vendorName, input.vendorName);

  await page.getByRole("tab", { name: /vendors/i }).click();
  const vendorsPanel = page.getByRole("tabpanel", { name: /vendors/i });
  await vendorsPanel.getByPlaceholder(/search master data/i).fill(input.vendorName);
  let row = vendorsPanel.getByRole("row", { name: new RegExp(escapeRegex(input.vendorName)) });
  await row.getByRole("button", { name: /edit/i }).click();
  let dialog = page.getByRole("dialog", { name: /edit catalog record/i });
  await dialog.getByLabel(/^name$/i).fill(input.editedVendorName);
  await dialog.getByRole("button", { name: /save/i }).click();
  await expect(dialog).toBeHidden();
  await vendorsPanel.getByPlaceholder(/search master data/i).fill(input.editedVendorName);
  row = vendorsPanel.getByRole("row", { name: new RegExp(escapeRegex(input.editedVendorName)) });
  await row.getByRole("button", { name: /archive/i }).click();
  await expect(row).toContainText(/archived/i);

  await createLocationRecord(page, "sites", input.siteCode, `Site ${input.siteCode}`);
  await createLocationRecord(
    page,
    "buildings",
    input.buildingCode,
    `Building ${input.buildingCode}`,
    input.siteCode,
  );
  await page.getByRole("tab", { name: /^buildings$/i }).click();
  const buildingsPanel = page.getByRole("tabpanel", { name: /^buildings$/i });
  await buildingsPanel.getByPlaceholder(/search master data/i).fill(input.buildingCode);
  row = buildingsPanel.getByRole("row", { name: new RegExp(escapeRegex(input.buildingCode)) });
  await row.getByRole("button", { name: /edit/i }).click();
  dialog = page.getByRole("dialog", { name: /edit location/i });
  await dialog.getByLabel(/^name$/i).fill(`Building ${input.buildingCode} Edited`);
  await dialog.getByRole("button", { name: /save/i }).click();
  await expect(dialog).toBeHidden();
  row = buildingsPanel.getByRole("row", { name: new RegExp(escapeRegex(input.buildingCode)) });
  await row.getByRole("button", { name: /archive/i }).click();
  await expect(row).toContainText(/archived/i);
}

async function createCatalogRecord(page: Page, resource: string, key: string, name: string) {
  await page.getByRole("button", { name: /new catalog record/i }).click();
  const dialog = page.getByRole("dialog", { name: /create catalog record/i });
  await dialog.locator("select").first().selectOption(resource);
  await dialog.getByLabel(/^key$/i).fill(key);
  if (resource === "custom-fields") {
    await dialog.getByLabel(/^label$/i).fill(name);
  } else {
    await dialog.getByLabel(/^name$/i).fill(name);
  }
  if (resource === "models") {
    await dialog.getByLabel(/model number/i).fill(`${key}-model`);
  }
  await dialog.getByRole("button", { name: /^create$/i }).click();
  await expect(dialog).toBeHidden();
}

async function createLocationRecord(
  page: Page,
  resource: string,
  code: string,
  name: string,
  parentText?: string,
) {
  await page.getByRole("button", { name: /new location/i }).click();
  const dialog = page.getByRole("dialog", { name: /create location/i });
  await dialog.locator("select").first().selectOption(resource);
  await dialog.getByLabel(/^code$/i).fill(code);
  await dialog.getByLabel(/^name$/i).fill(name);
  if (parentText) {
    await selectOptionByText(dialog.locator("select").nth(1), parentText);
  }
  await dialog.getByRole("button", { name: /^create$/i }).click();
  await expect(dialog).toBeHidden();
}

async function createEditAssetLifecycleAndAttachment(page: Page, assetTag: string) {
  await page.goto("/assets");
  await page.getByRole("button", { name: /register asset/i }).click();
  let dialog = page.getByRole("dialog", { name: /register asset/i });
  await dialog.getByLabel(/asset tag/i).fill(assetTag);
  await dialog.getByLabel(/^name$/i).fill(`Customer Asset ${assetTag}`);
  await dialog.getByLabel(/serial number/i).fill(`${assetTag}-SERIAL`);
  await dialog.getByRole("button", { name: /^register$/i }).click();
  await expect(dialog).toBeHidden();

  await page.getByPlaceholder(/search by tag/i).fill(assetTag);
  await page.getByRole("link", { name: assetTag }).click();
  await expect(
    page.getByRole("heading", { name: new RegExp(escapeRegex(assetTag)) }),
  ).toBeVisible();

  await page.getByRole("button", { name: /edit asset/i }).click();
  dialog = page.getByRole("dialog", { name: /edit asset/i });
  await dialog.getByLabel(/^name$/i).fill(`Customer Asset ${assetTag} Edited`);
  await dialog.locator('select[name="condition"]').selectOption("fair");
  await dialog.getByRole("button", { name: /save asset/i }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("tab", { name: /lifecycle/i }).click();
  await page.getByRole("button", { name: /add event/i }).click();
  dialog = page.getByRole("dialog", { name: /add lifecycle event/i });
  await dialog.getByLabel(/event type/i).fill("customer.qa");
  await dialog.getByRole("button", { name: /add event/i }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/customer.qa/i)).toBeVisible();

  await page.getByRole("tab", { name: /attachments/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "customer-release-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Custivio customer release attachment"),
  });
  await expect(page.getByText("customer-release-note.txt")).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /^download$/i })
    .first()
    .click();
  await download;
  await page
    .getByRole("button", { name: /^delete$/i })
    .first()
    .click();
  await expect(page.getByText("customer-release-note.txt")).toBeHidden();
}

async function createStockItemAndMovements(page: Page, sku: string, unitCode: string) {
  await page.goto("/stock");
  await page.getByRole("button", { name: /new item/i }).click();
  let dialog = page.getByRole("dialog", { name: /new stock item/i });
  await dialog.getByLabel(/^sku$/i).fill(sku);
  await dialog.getByLabel(/^name$/i).fill(`Customer Stock ${sku}`);
  await dialog.getByLabel(/item type/i).fill("consumable");
  await dialog.getByLabel(/low stock threshold/i).fill("10");
  await dialog.getByLabel(/new unit code/i).fill(unitCode);
  await dialog.getByLabel(/new unit name/i).fill(`Unit ${unitCode}`);
  await dialog.getByRole("button", { name: /create item/i }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("row", { name: new RegExp(escapeRegex(sku), "i") })).toBeVisible();

  for (const movement of [
    { type: "receive", quantity: "30", to: "default" },
    { type: "issue", quantity: "5", from: "default" },
    { type: "transfer", quantity: "3", from: "default", to: "secondary" },
    { type: "adjust", quantity: "2", to: "default" },
  ]) {
    await page.getByRole("button", { name: /^movement$/i }).click();
    dialog = page.getByRole("dialog", { name: /record stock movement/i });
    await selectOptionByText(dialog.locator('select[name="stockItemId"]'), sku);
    await dialog.locator('select[name="movementType"]').selectOption(movement.type);
    await dialog.getByLabel(/quantity/i).fill(movement.quantity);
    if (movement.from) await dialog.getByLabel(/from location key/i).fill(movement.from);
    if (movement.to) await dialog.getByLabel(/to location key/i).fill(movement.to);
    await dialog.getByLabel(/reference/i).fill(`customer-${movement.type}-${uniqueSuffix()}`);
    await dialog.getByRole("button", { name: /submit movement/i }).click();
    await expect(dialog).toBeHidden();
  }
}

async function completeCustodyAndTransferFlows(page: Page, assetTag: string) {
  await page.goto("/custody");
  await page.getByRole("button", { name: /check out asset/i }).click();
  let dialog = page.getByRole("dialog", { name: /check out asset/i });
  await selectOptionByText(dialog.locator('select[name="assetId"]'), assetTag);
  await dialog.getByLabel(/notes/i).fill("Customer browser checkout");
  await dialog.getByRole("button", { name: /^check out$/i }).click();
  await expect(dialog).toBeHidden();

  let row = page.getByRole("row", { name: new RegExp(escapeRegex(assetTag)) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /handover/i }).click();
  dialog = page.getByRole("dialog", { name: /hand over asset/i });
  await dialog.getByLabel(/notes/i).fill("Customer browser handover");
  await dialog.getByRole("button", { name: /hand over/i }).click();
  await expect(dialog).toBeHidden();

  row = page.getByRole("row", { name: new RegExp(escapeRegex(assetTag)) });
  await row.getByRole("button", { name: /check in/i }).click();
  await expect(row).toHaveCount(0);

  await page.getByRole("button", { name: /request transfer/i }).click();
  dialog = page.getByRole("dialog", { name: /request transfer/i });
  await selectOptionByText(dialog.locator('select[name="assetId"]'), assetTag);
  await dialog.getByLabel(/reason/i).fill("Customer approval flow");
  await dialog.getByRole("button", { name: /create request/i }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("tab", { name: /transfer requests/i }).click();
  row = page.getByRole("row", { name: new RegExp(escapeRegex(assetTag)) });
  await row.getByRole("button", { name: /approve/i }).click();
  await expect(row).toContainText(/approved/i);

  await page.getByRole("button", { name: /request transfer/i }).click();
  dialog = page.getByRole("dialog", { name: /request transfer/i });
  await selectOptionByText(dialog.locator('select[name="assetId"]'), assetTag);
  await dialog.getByLabel(/reason/i).fill("Customer rejection flow");
  await dialog.getByRole("button", { name: /create request/i }).click();
  await expect(dialog).toBeHidden();
  row = page
    .getByRole("row", { name: new RegExp(escapeRegex(assetTag)) })
    .filter({ hasText: /pending/i });
  await row.getByRole("button", { name: /reject/i }).click();
  await expect(
    page
      .getByRole("row", { name: new RegExp(escapeRegex(assetTag)) })
      .filter({ hasText: /rejected/i }),
  ).toBeVisible();
}

async function completeMaintenanceAndWarrantyFlows(page: Page, assetTag: string, suffix: string) {
  await page.goto("/maintenance");
  await page.getByRole("button", { name: /new ticket/i }).click();
  let dialog = page.getByRole("dialog", { name: /new maintenance ticket/i });
  await selectOptionByText(dialog.locator('select[name="assetId"]'), assetTag);
  await dialog.getByLabel(/issue summary/i).fill(`Customer ticket ${suffix}`);
  await dialog.locator('select[name="priority"]').selectOption("high");
  await dialog.getByRole("button", { name: /create ticket/i }).click();
  await expect(dialog).toBeHidden();

  let row = page.getByRole("row", { name: new RegExp(`Customer ticket ${escapeRegex(suffix)}`) });
  await row.getByRole("button", { name: /start/i }).click();
  await expect(row).toContainText(/in progress/i);
  row = page.getByRole("row", { name: new RegExp(`Customer ticket ${escapeRegex(suffix)}`) });
  await row.getByRole("button", { name: /resolve/i }).click();
  await expect(row).toContainText(/resolved/i);

  await page.getByRole("button", { name: /new warranty/i }).click();
  dialog = page.getByRole("dialog", { name: /new warranty/i });
  await selectOptionByText(dialog.locator('select[name="assetId"]'), assetTag);
  await dialog.getByLabel(/provider/i).fill(`Customer Warranty ${suffix}`);
  await dialog.getByLabel(/starts at/i).fill("2026-01-01");
  await dialog.getByLabel(/ends at/i).fill("2027-01-01");
  await dialog.getByRole("button", { name: /create warranty/i }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: /warranties/i }).click();
  await expect(page.getByText(`Customer Warranty ${suffix}`)).toBeVisible();
}

async function completeAuditImportExportReportFlows(
  page: Page,
  campaignName: string,
  importFilename: string,
  filterName: string,
) {
  await page.goto("/audit-reports");
  await page.getByRole("button", { name: /campaign/i }).click();
  let dialog = page.getByRole("dialog", { name: /create audit campaign/i });
  await dialog.getByLabel(/^name$/i).fill(campaignName);
  await dialog.getByLabel(/scope/i).fill("all_assets");
  await dialog.getByRole("button", { name: /^create$/i }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(campaignName)).toBeVisible();

  await page.getByRole("button", { name: /^scan$/i }).click();
  dialog = page.getByRole("dialog", { name: /submit scan/i });
  await dialog.getByLabel(/scan code/i).fill(`SCAN-${uniqueSuffix()}`);
  await dialog.locator('select[name="resultStatus"]').selectOption("matched");
  await dialog.getByLabel(/notes/i).fill("Customer scan evidence");
  await dialog.getByRole("button", { name: /^submit$/i }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: /import preview/i }).click();
  dialog = page.getByRole("dialog", { name: /create import preview/i });
  await dialog.getByLabel(/filename/i).fill(importFilename);
  await dialog
    .getByLabel(/rows json/i)
    .fill(`[{"assetTag":"IMP-${uniqueSuffix()}","name":"Imported customer asset"}]`);
  await dialog.getByRole("button", { name: /create preview/i }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: /import jobs/i }).click();
  await expect(page.getByText(importFilename)).toBeVisible();
  await page.getByRole("button", { name: /process latest/i }).click();

  await page.getByRole("button", { name: /saved filter/i }).click();
  dialog = page.getByRole("dialog", { name: /create saved filter/i });
  await dialog.getByLabel(/^name$/i).fill(filterName);
  await dialog.getByLabel(/^key$/i).fill(`filter-${uniqueSuffix()}`);
  await dialog.getByRole("button", { name: /^save$/i }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: /saved filters/i }).click();
  await expect(page.getByText(filterName)).toBeVisible();

  await page.getByRole("button", { name: /export job/i }).click();
  dialog = page.getByRole("dialog", { name: /create export job/i });
  await dialog.locator('select[name="exportType"]').selectOption("assets");
  await dialog.getByLabel(/filter key/i).fill("status");
  await dialog.getByLabel(/filter value/i).fill("in_stock");
  await dialog.getByRole("button", { name: /create export/i }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: /export jobs/i }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /download/i })
    .first()
    .click();
  await download;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in to your tenant/i })).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const tenantInput = page.getByLabel(/tenant code/i);
      const emailInput = page.getByLabel(/^email$/i);
      const passwordInput = page.getByLabel(/^password$/i);

      await expect(emailInput).toBeEditable();
      await tenantInput.fill("default");
      await emailInput.fill(email);
      await passwordInput.fill(password);
      await expect(tenantInput).toHaveValue("default");
      await expect(emailInput).toHaveValue(email);
      await expect(passwordInput).toHaveValue(password);
      await page.waitForTimeout(250);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 7_500 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.reload();
      await expect(page.getByRole("heading", { name: /sign in to your tenant/i })).toBeVisible();
    }
  }
}

async function signOut(page: Page) {
  await closeOpenDialogs(page);
  await page.getByRole("button", { name: /permissions/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

async function closeOpenDialogs(page: Page) {
  const dialogs = page.locator('[role="dialog"]');
  if ((await dialogs.count()) === 0 || !(await dialogs.first().isVisible())) return;

  await page.keyboard.press("Escape");
  if (await dialogs.first().isVisible()) {
    await dialogs
      .first()
      .getByRole("button", { name: /^(close|cancel)$/i })
      .click();
  }
  await expect(dialogs).toHaveCount(0);
}

async function selectOptionByText(select: Locator, text: string) {
  const value = await select.evaluate((element, textToFind) => {
    if (!(element instanceof HTMLSelectElement)) return "";
    const option = Array.from(element.options).find((item) =>
      item.textContent?.includes(textToFind),
    );
    return option?.value ?? "";
  }, text);
  expect(value, `select option containing ${text}`).not.toBe("");
  await select.selectOption(value);
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
