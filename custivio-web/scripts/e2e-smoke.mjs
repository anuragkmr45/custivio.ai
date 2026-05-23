#!/usr/bin/env node

const apiBase = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3004";
const frontendBase = process.env.E2E_FRONTEND_BASE_URL ?? "http://127.0.0.1:5177";
const tenantSlug = process.env.E2E_TENANT_SLUG ?? "default";
const email = process.env.E2E_ADMIN_EMAIL ?? process.env.UAT_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.UAT_SEED_PASSWORD;

if (!email) {
  throw new Error("Set E2E_ADMIN_EMAIL or UAT_ADMIN_EMAIL before running E2E smoke tests.");
}

if (!password) {
  throw new Error("Set E2E_ADMIN_PASSWORD or UAT_SEED_PASSWORD before running E2E smoke tests.");
}

let cookie = "";
const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const marker = status === "PASS" ? "ok" : status === "SKIP" ? "skip" : "fail";
  console.log(`${marker} ${name}${detail ? ` - ${detail}` : ""}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function updateCookie(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return;
  cookie = setCookie
    .split(",")
    .map((entry) => entry.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });
  updateCookie(response);
  return response;
}

async function apiJson(path, options = {}) {
  const body = options.body;
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  if (body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await api(path, {
    ...options,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? response.statusText;
    throw new Error(`${options.method ?? "GET"} ${path} failed ${response.status}: ${message}`);
  }
  return payload;
}

async function step(name, fn) {
  try {
    const detail = await fn();
    record(name, "PASS", detail);
  } catch (error) {
    record(name, "FAIL", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function main() {
  let createdAssetId = "";
  let createdAttachmentId = "";

  await step("frontend routes respond", async () => {
    const paths = [
      "/",
      "/assets",
      "/catalog",
      "/stock",
      "/custody",
      "/maintenance",
      "/audit-reports",
      "/status",
      "/users",
      "/roles",
      "/assignments",
    ];
    for (const path of paths) {
      const response = await fetch(`${frontendBase}${path}`);
      assert(response.ok, `${path} returned ${response.status}`);
    }
    return `${paths.length} routes`;
  });

  await step("backend login", async () => {
    const payload = await apiJson("/api/auth/login", {
      method: "POST",
      body: { tenantSlug, email, password },
    });
    assert(payload.session?.user?.email === email, "session email mismatch");
    assert(cookie.includes("custivio_session="), "session cookie missing");
    return payload.session.user.email;
  });

  await step("session restore", async () => {
    const payload = await apiJson("/api/auth/me");
    const session = payload.session ?? payload;
    assert(session?.permissionKeys?.length > 0, "permission keys missing");
    return `${session.permissionKeys.length} permissions`;
  });

  let assetTypeId = "";
  let modelId = "";
  let vendorId = "";
  let stockItemId = "";
  let firstCampaignId = "";

  await step("catalog and locations", async () => {
    const [types, models, vendors, sites] = await Promise.all([
      apiJson("/api/catalog/types"),
      apiJson("/api/catalog/models"),
      apiJson("/api/catalog/vendors"),
      apiJson("/api/locations/sites"),
    ]);
    assetTypeId = types.records?.[0]?.id;
    modelId = models.records?.[0]?.id;
    vendorId = vendors.records?.[0]?.id;
    assert(assetTypeId, "asset type missing");
    assert(sites.records?.length > 0, "site missing");
    return `${types.records.length} types, ${sites.records.length} sites`;
  });

  await step("asset list/search/detail/create", async () => {
    const search = await apiJson("/api/assets?q=UAT-LAP-001");
    assert(search.assets?.length > 0, "UAT-LAP-001 not found");
    const unique = Date.now();
    const created = await apiJson("/api/assets", {
      method: "POST",
      body: {
        assetTypeId,
        modelId,
        vendorId,
        assetTag: `E2E-${unique}`,
        serialNumber: `E2E-SN-${unique}`,
        name: `E2E smoke asset ${unique}`,
        status: "in_stock",
        condition: "good",
      },
    });
    createdAssetId = created.asset.id;
    const detail = await apiJson(`/api/assets/${createdAssetId}`);
    assert(detail.detail?.asset?.id === createdAssetId, "created asset detail mismatch");
    return created.asset.assetTag;
  });

  await step("asset lifecycle and attachment", async () => {
    await apiJson(`/api/assets/${createdAssetId}/lifecycle`, {
      method: "POST",
      body: { eventType: "e2e_verified", metadata: { source: "frontend-e2e" } },
    });
    const { body, contentType } = multipartFileBody(
      "file",
      "e2e.txt",
      "text/plain",
      "frontend e2e attachment",
    );
    const upload = await api(`/api/assets/${createdAssetId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });
    const uploaded = await upload.json();
    assert(upload.ok, uploaded?.error?.message ?? "upload failed");
    createdAttachmentId = uploaded.attachment.id;
    const download = await api(
      `/api/assets/${createdAssetId}/attachments/${createdAttachmentId}/download`,
    );
    assert(download.ok, `download returned ${download.status}`);
    await apiJson(`/api/assets/${createdAssetId}/attachments/${createdAttachmentId}`, {
      method: "DELETE",
    });
    return createdAttachmentId.slice(0, 8);
  });

  await step("stock movement", async () => {
    const overview = await apiJson("/api/stock/items");
    stockItemId = overview.items?.[0]?.id;
    assert(stockItemId, "stock item missing");
    const movement = await apiJson("/api/stock/movements", {
      method: "POST",
      body: {
        stockItemId,
        movementType: "receive",
        quantity: 1,
        toLocationKey: "e2e",
        reason: "frontend e2e smoke",
        idempotencyKey: `e2e-stock-${Date.now()}`,
      },
    });
    assert(movement.ledger?.id, "ledger missing");
    return movement.ledger.id.slice(0, 8);
  });

  await step("custody and transfers", async () => {
    const overview = await apiJson("/api/custody/checkouts");
    assert(overview.users?.length > 0, "users missing");
    const userId = overview.users[0].id;
    const checkout = await apiJson("/api/custody/checkouts", {
      method: "POST",
      body: { assetId: createdAssetId, assignedToUserId: userId, notes: "frontend e2e" },
    });
    assert(checkout.assignment?.id, "assignment missing");
    await apiJson("/api/custody/checkins", {
      method: "POST",
      body: { assignmentId: checkout.assignment.id, notes: "frontend e2e complete" },
    });
    const transfer = await apiJson("/api/transfers", {
      method: "POST",
      body: { assetId: createdAssetId, toCustodianUserId: userId, reason: "frontend e2e" },
    });
    assert(transfer.transfer?.id, "transfer missing");
    return transfer.transfer.id.slice(0, 8);
  });

  await step("maintenance and warranty", async () => {
    const ticket = await apiJson("/api/maintenance/tickets", {
      method: "POST",
      body: { assetId: createdAssetId, issueSummary: "Frontend E2E ticket", priority: "low" },
    });
    assert(ticket.ticket?.id, "ticket missing");
    await apiJson(`/api/maintenance/tickets/${ticket.ticket.id}/status`, {
      method: "POST",
      body: { status: "in_progress", note: "frontend e2e" },
    });
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const warranty = await apiJson("/api/maintenance/warranties", {
      method: "POST",
      body: {
        assetId: createdAssetId,
        provider: "E2E Provider",
        startsAt: today,
        endsAt: nextYear,
      },
    });
    assert(warranty.warranty?.id, "warranty missing");
    return ticket.ticket.id.slice(0, 8);
  });

  await step("audit import export reports", async () => {
    const campaign = await apiJson("/api/audits/campaigns", {
      method: "POST",
      body: { name: `E2E campaign ${Date.now()}`, scope: "all_assets" },
    });
    firstCampaignId = campaign.campaign.id;
    await apiJson("/api/audits/scans", {
      method: "POST",
      body: {
        campaignId: firstCampaignId,
        assetId: createdAssetId,
        scanCode: `E2E-${createdAssetId}`,
        resultStatus: "matched",
      },
    });
    const importPreview = await apiJson("/api/imports/jobs", {
      method: "POST",
      body: {
        importType: "assets",
        originalFilename: "e2e-import.json",
        rows: [{ assetTag: `E2E-IMPORT-${Date.now()}` }],
        idempotencyKey: `e2e-import-${Date.now()}`,
      },
    });
    assert(importPreview.preview?.job?.id, "import job missing");
    await apiJson(`/api/imports/jobs/${importPreview.preview.job.id}/process`, {
      method: "POST",
    });
    const exportJob = await apiJson("/api/reports/exports", {
      method: "POST",
      body: {
        exportType: "assets",
        filters: { source: "frontend-e2e" },
        idempotencyKey: `e2e-export-${Date.now()}`,
      },
    });
    assert(exportJob.exportJob?.id, "export job missing");
    await apiJson("/api/reports/filters", {
      method: "POST",
      body: {
        module: "assets",
        key: `e2e-${Date.now()}`,
        name: "E2E smoke filter",
        filters: { status: "active" },
      },
    });
    return exportJob.exportJob.id.slice(0, 8);
  });

  await step("ops health metrics openapi", async () => {
    const [live, ready, ops, metrics, openapi] = await Promise.all([
      api("/api/health/live"),
      api("/api/health/ready"),
      apiJson("/api/ops/status"),
      api("/api/metrics"),
      apiJson("/api/openapi.json"),
    ]);
    assert(live.ok, "live failed");
    assert(ready.ok, "ready failed");
    assert(ops.service, "ops service missing");
    assert(metrics.ok, "metrics failed");
    assert(Object.keys(openapi.paths ?? {}).length > 0, "openapi paths missing");
    return `${Object.keys(openapi.paths).length} openapi paths`;
  });

  await step("logout and 401", async () => {
    await apiJson("/api/auth/logout", { method: "POST" });
    const response = await api("/api/auth/me");
    assert(response.status === 401, `expected 401, got ${response.status}`);
    return "session cleared";
  });

  const failed = results.filter((result) => result.status === "FAIL").length;
  if (failed > 0) {
    throw new Error(`${failed} E2E checks failed.`);
  }
}

function multipartFileBody(fieldName, filename, contentType, content) {
  const boundary = `----custivio-e2e-${Date.now()}`;
  const chunks = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`,
    `Content-Type: ${contentType}\r\n\r\n`,
    content,
    `\r\n--${boundary}--\r\n`,
  ];
  return {
    body: Buffer.from(chunks.join("")),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
