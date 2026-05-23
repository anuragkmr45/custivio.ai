import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRole, listRoleAssignments, listUsers } from "./admin";
import { downloadAssetAttachment, listAssets, uploadAssetAttachment } from "./assets";
import { archiveCatalogRecord, listCatalogRecords } from "./catalog";
import { checkoutAsset, decideTransfer, getCustodyOverview } from "./custody";
import { archiveLocationRecord, listLocationRecords } from "./locations";
import { createMaintenanceTicket, listMaintenanceTickets } from "./maintenance";
import { createExportJob, createImportPreview, downloadExportJob } from "./reporting";
import { getMetricsText, getOpsStatus } from "./status";
import { createStockMovement, getStockOverview } from "./stock";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("business API services", () => {
  it("maps admin list and mutation endpoints", async () => {
    const fetchMock = mockFetch(
      json({ users: [] }),
      json({ assignments: [] }),
      json({ role: { id: "role-1" } }, 201),
    );

    await listUsers();
    await listRoleAssignments();
    await createRole({ key: "qa", name: "QA", permissionKeys: ["assets.read"] });

    expect(call(fetchMock, 0)).toMatchObject({ url: "/api/admin/users", method: "GET" });
    expect(call(fetchMock, 1)).toMatchObject({
      url: "/api/admin/assignments",
      method: "GET",
    });
    expect(call(fetchMock, 2)).toMatchObject({ url: "/api/admin/roles", method: "POST" });
  });

  it("maps catalog and location resource routes", async () => {
    const fetchMock = mockFetch(
      json({ records: [] }),
      json({ record: { id: "cat-1" } }),
      json({ records: [] }),
      json({ record: { id: "site-1" } }),
    );

    await listCatalogRecords("categories");
    await archiveCatalogRecord("categories", "cat-1");
    await listLocationRecords("sites");
    await archiveLocationRecord("sites", "site-1");

    expect(call(fetchMock, 0)).toMatchObject({ url: "/api/catalog/categories", method: "GET" });
    expect(call(fetchMock, 1)).toMatchObject({
      url: "/api/catalog/categories/cat-1",
      method: "DELETE",
    });
    expect(call(fetchMock, 2)).toMatchObject({ url: "/api/locations/sites", method: "GET" });
    expect(call(fetchMock, 3)).toMatchObject({
      url: "/api/locations/sites/site-1",
      method: "DELETE",
    });
  });

  it("maps asset list, upload, and download endpoints", async () => {
    const fetchMock = mockFetch(
      json({ assets: [] }),
      json({ attachment: { id: "att-1" } }, 201),
      new Response(new Blob(["attachment"]), { status: 200 }),
    );

    await listAssets({ q: "UAT-LAP-001", limit: 25, offset: 0 });
    await uploadAssetAttachment("asset-1", new Blob(["demo"]), "demo.txt");
    await downloadAssetAttachment("asset-1", "att-1");

    expect(call(fetchMock, 0)).toMatchObject({
      url: "/api/assets?q=UAT-LAP-001&limit=25&offset=0",
      method: "GET",
    });
    expect(call(fetchMock, 1)).toMatchObject({
      url: "/api/assets/asset-1/attachments",
      method: "POST",
    });
    expect(call(fetchMock, 1).contentType).toBeNull();
    expect(call(fetchMock, 2)).toMatchObject({
      url: "/api/assets/asset-1/attachments/att-1/download",
      method: "GET",
    });
  });

  it("maps stock, custody, and transfer mutation routes", async () => {
    const fetchMock = mockFetch(
      json({ units: [], items: [], balances: [], ledger: [], lowStock: [] }),
      json({ ledger: { id: "ledger-1" } }, 201),
      json({ assets: [], users: [], assignments: [], transfers: [] }),
      json({ assignment: { id: "assignment-1" } }, 201),
      json({ transfer: { id: "transfer-1" } }),
    );

    await getStockOverview();
    await createStockMovement({
      stockItemId: "stock-1",
      movementType: "receive",
      quantity: 1,
      idempotencyKey: "idem-1",
    });
    await getCustodyOverview();
    await checkoutAsset({ assetId: "asset-1", assignedToUserId: "user-1" });
    await decideTransfer("transfer-1", { decision: "approved" });

    expect(call(fetchMock, 0)).toMatchObject({ url: "/api/stock/items", method: "GET" });
    expect(call(fetchMock, 1)).toMatchObject({
      url: "/api/stock/movements",
      method: "POST",
      idempotencyKey: "idem-1",
    });
    expect(call(fetchMock, 2)).toMatchObject({
      url: "/api/custody/checkouts",
      method: "GET",
    });
    expect(call(fetchMock, 3)).toMatchObject({
      url: "/api/custody/checkouts",
      method: "POST",
    });
    expect(call(fetchMock, 4)).toMatchObject({
      url: "/api/transfers/transfer-1/decision",
      method: "POST",
    });
  });

  it("maps maintenance, reporting, and status routes", async () => {
    const fetchMock = mockFetch(
      json({ tickets: [] }),
      json({ ticket: { id: "ticket-1" } }, 201),
      json({ preview: { job: { id: "import-1" }, rows: [] } }, 201),
      json({ exportJob: { id: "export-1" } }, 201),
      new Response(new Blob(["export"]), { status: 200 }),
      json({ service: "api", operationalStatus: "ready", dependencies: [] }),
      new Response("inventory_api_requests_total 1", { status: 200 }),
    );

    await listMaintenanceTickets();
    await createMaintenanceTicket({ assetId: "asset-1", issueSummary: "Fan failure" });
    await createImportPreview({
      importType: "assets",
      originalFilename: "assets.csv",
      rows: [],
      idempotencyKey: "import-1",
    });
    await createExportJob({
      exportType: "assets",
      idempotencyKey: "export-1",
    });
    await downloadExportJob("export-1");
    await getOpsStatus();
    await getMetricsText();

    expect(call(fetchMock, 0)).toMatchObject({
      url: "/api/maintenance/tickets",
      method: "GET",
    });
    expect(call(fetchMock, 1)).toMatchObject({
      url: "/api/maintenance/tickets",
      method: "POST",
    });
    expect(call(fetchMock, 2)).toMatchObject({
      url: "/api/imports/jobs",
      method: "POST",
      idempotencyKey: "import-1",
    });
    expect(call(fetchMock, 3)).toMatchObject({
      url: "/api/reports/exports",
      method: "POST",
      idempotencyKey: "export-1",
    });
    expect(call(fetchMock, 4)).toMatchObject({
      url: "/api/reports/exports/export-1/download",
      method: "GET",
    });
    expect(call(fetchMock, 5)).toMatchObject({ url: "/api/ops/status", method: "GET" });
    expect(call(fetchMock, 6)).toMatchObject({ url: "/api/metrics", method: "GET" });
  });
});

type FetchMock = ReturnType<typeof vi.fn> & {
  mock: { calls: Array<[RequestInfo | URL, RequestInit?]> };
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockFetch(...responses: Response[]): FetchMock {
  const queue = [...responses];
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    const response = queue.shift();
    if (!response) throw new Error("Unexpected fetch call.");
    return response;
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock as FetchMock;
}

function call(fetchMock: FetchMock, index: number) {
  const [input, init] = fetchMock.mock.calls[index] ?? [];
  if (!input || !init) throw new Error(`Expected fetch call ${index}.`);
  const url = new URL(String(input));
  const headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers);

  return {
    url: `${url.pathname}${url.search}`,
    method: init.method,
    contentType: headers.get("content-type"),
    idempotencyKey: headers.get("idempotency-key"),
  };
}
