import { expect, test, type Locator, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.UAT_ADMIN_EMAIL;
const storeEmail = process.env.E2E_STORE_EMAIL ?? process.env.UAT_STORE_EMAIL;
const auditorEmail = process.env.E2E_AUDITOR_EMAIL ?? process.env.UAT_AUDITOR_EMAIL;
const viewerEmail = process.env.E2E_VIEWER_EMAIL ?? process.env.UAT_VIEWER_EMAIL;
const uatPassword = process.env.E2E_PASSWORD ?? process.env.UAT_SEED_PASSWORD;

test.describe("Custivio real-user browser UAT", () => {
  test.skip(!adminEmail || !uatPassword, "Set E2E_ADMIN_EMAIL/UAT_ADMIN_EMAIL and password envs.");

  test("admin can use core product routes with real backend data", async ({ page }) => {
    await login(page, adminEmail!, uatPassword!);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    await page.getByRole("link", { name: /assets/i }).click();
    await expect(page.getByRole("heading", { name: /asset registry/i })).toBeVisible();
    const assetSearch = page.getByPlaceholder(/search by tag/i);
    const assetsUrl = page.url();
    await assetSearch.fill("UAT-LAP-001");
    await page.waitForTimeout(450);
    await expect(page).toHaveURL(assetsUrl);
    await expect(assetSearch).toHaveValue("UAT-LAP-001");
    await expect(page.getByText("UAT-LAP-001")).toBeVisible();

    const uniqueAssetTag = `PW-${Date.now()}`;
    await page.getByRole("button", { name: /register asset/i }).click();
    const registerDialog = page.getByRole("dialog", { name: /register asset/i });
    await expectNoHorizontalOverflow(registerDialog);
    await expectNoDuplicateSelectOptions(registerDialog.locator('select[name="assetTypeId"]'));
    await registerDialog.getByLabel(/asset tag/i).fill(uniqueAssetTag);
    await registerDialog.getByLabel(/^name$/i).fill(`Playwright Asset ${uniqueAssetTag}`);
    await registerDialog.getByLabel(/serial number/i).fill(`${uniqueAssetTag}-SERIAL`);
    await registerDialog.getByRole("button", { name: /^register$/i }).click();
    await expect(registerDialog).toBeHidden();

    await page.getByPlaceholder(/search by tag/i).fill(uniqueAssetTag);
    await expect(page.getByRole("link", { name: uniqueAssetTag })).toBeVisible();
    await page.getByRole("link", { name: uniqueAssetTag }).click();
    await expect(page.getByRole("heading", { name: new RegExp(uniqueAssetTag) })).toBeVisible();
    await expect(page.getByText(/asset type id/i)).toHaveCount(0);

    await page.getByRole("tab", { name: /qr label/i }).click();
    await expect(page.getByAltText(`${uniqueAssetTag} QR code`)).toBeVisible();

    await page.getByRole("tab", { name: /attachments/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "playwright-uat-note.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Custivio Playwright UAT attachment"),
    });
    await expect(page.getByText("playwright-uat-note.txt")).toBeVisible();

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
    await expect(page.getByText("playwright-uat-note.txt")).toBeHidden();

    for (const [linkName, heading] of [
      [/stock/i, /stock/i],
      [/custody/i, /custody/i],
      [/maintenance/i, /maintenance/i],
      [/audit & reports/i, /audit & reports/i],
      [/status/i, /system status/i],
    ] as const) {
      await page.getByRole("link", { name: linkName }).click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("lower-permission personas cannot access admin pages", async ({ page }) => {
    const personaEmail = storeEmail ?? auditorEmail ?? viewerEmail;
    test.skip(!personaEmail || !uatPassword, "Set a lower-permission UAT persona email.");

    await login(page, personaEmail!, uatPassword!);
    await page.goto("/users");

    await expect(page.getByText(/access denied/i).first()).toBeVisible();
    await expect(page.getByText(/required: users.manage/i)).toBeVisible();
  });
});

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

async function expectNoHorizontalOverflow(locator: Locator) {
  await expect
    .poll(async () =>
      locator.evaluate((node) => {
        const element = node as HTMLElement;
        return element.scrollWidth <= element.clientWidth + 1;
      }),
    )
    .toBe(true);
}

async function expectNoDuplicateSelectOptions(locator: Locator) {
  const labels = await locator.evaluate((select) =>
    Array.from((select as HTMLSelectElement).options)
      .map((option) => option.textContent?.trim().toLowerCase() ?? "")
      .filter(Boolean),
  );

  expect(new Set(labels).size).toBe(labels.length);
}
