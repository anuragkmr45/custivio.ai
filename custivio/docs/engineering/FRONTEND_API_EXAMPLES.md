# Frontend API Examples

Assume the API is running at `http://localhost:3001` and UAT seed data exists.

```bash
API=http://localhost:3001
COOKIE_JAR=/tmp/custivio.cookies
UAT_ADMIN_EMAIL=${UAT_ADMIN_EMAIL:?Set UAT_ADMIN_EMAIL from custivio/.env}
UAT_SEED_PASSWORD=${UAT_SEED_PASSWORD:?Set UAT_SEED_PASSWORD from custivio/.env}
```

## Login And Session

```bash
curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -d "{\"tenantSlug\":\"default\",\"email\":\"$UAT_ADMIN_EMAIL\",\"password\":\"$UAT_SEED_PASSWORD\"}" \
  "$API/api/auth/login"

curl -sS -b "$COOKIE_JAR" -H "accept: application/json" "$API/api/auth/me"
```

## Resolve Seeded IDs

```bash
curl -sS -b "$COOKIE_JAR" "$API/api/catalog/types"
curl -sS -b "$COOKIE_JAR" "$API/api/catalog/models"
curl -sS -b "$COOKIE_JAR" "$API/api/catalog/vendors"
curl -sS -b "$COOKIE_JAR" "$API/api/assets?q=UAT-LAP-001"
curl -sS -b "$COOKIE_JAR" "$API/api/stock/items"
curl -sS -b "$COOKIE_JAR" "$API/api/custody/checkouts"
curl -sS -b "$COOKIE_JAR" "$API/api/maintenance/tickets"
curl -sS -b "$COOKIE_JAR" "$API/api/reports/exports"
```

## Create Asset

Replace `assetTypeId`, `modelId`, and `vendorId` with IDs from catalog list responses.

```bash
curl -sS -b "$COOKIE_JAR" \
  -H "content-type: application/json" \
  -d '{
    "assetTypeId":"<assetTypeId>",
    "modelId":"<modelId>",
    "vendorId":"<vendorId>",
    "assetTag":"UAT-FE-LAP-001",
    "serialNumber":"UAT-FE-SN-001",
    "name":"Frontend Test Laptop",
    "status":"in_stock",
    "condition":"good",
    "customFields":{"cpu":"Intel Core i7","ram_gb":32}
  }' \
  "$API/api/assets"
```

## Upload And Download Attachment

```bash
curl -sS -b "$COOKIE_JAR" \
  -F "file=@./README.md;type=text/plain" \
  "$API/api/assets/<assetId>/attachments"

curl -sS -b "$COOKIE_JAR" \
  -o /tmp/inventory-attachment-download.txt \
  "$API/api/assets/<assetId>/attachments/<attachmentId>/download"
```

## Stock Movement

Replace `stockItemId` with a seeded SKU ID, for example `UAT-CABLE-CAT6-1M`.

```bash
curl -sS -b "$COOKIE_JAR" \
  -H "content-type: application/json" \
  -d '{
    "stockItemId":"<stockItemId>",
    "movementType":"issue",
    "quantity":1,
    "fromLocationKey":"BIN-SPARES-A",
    "reason":"Frontend smoke issue",
    "referenceId":"FE-STOCK-001",
    "idempotencyKey":"fe-stock-001"
  }' \
  "$API/api/stock/movements"
```

Repeating the same request with the same `idempotencyKey` returns the original ledger entry. Changing payload with the same key returns `409 idempotency_conflict`.

## Maintenance Ticket

```bash
curl -sS -b "$COOKIE_JAR" \
  -H "content-type: application/json" \
  -d '{
    "assetId":"<assetId>",
    "assignedToUserId":"<userId>",
    "priority":"medium",
    "issueSummary":"Frontend test maintenance ticket"
  }' \
  "$API/api/maintenance/tickets"
```

## Audit Scan

```bash
curl -sS -b "$COOKIE_JAR" \
  -H "content-type: application/json" \
  -d '{
    "campaignId":"<campaignId>",
    "assetId":"<assetId>",
    "scanCode":"qr:UAT-LAP-001",
    "resultStatus":"found",
    "notes":"Frontend smoke scan"
  }' \
  "$API/api/audits/scans"
```

## Import Job

```bash
curl -sS -b "$COOKIE_JAR" \
  -H "content-type: application/json" \
  -d '{
    "importType":"assets",
    "originalFilename":"frontend-assets.csv",
    "idempotencyKey":"fe-import-001",
    "rows":[{"assetTag":"FE-IMPORT-001","serialNumber":"FE-IMPORT-SN-001"}],
    "metadata":{"source":"frontend-smoke"}
  }' \
  "$API/api/imports/jobs"

curl -sS -b "$COOKIE_JAR" "$API/api/imports/jobs"
```

## Export Job And Download

```bash
curl -sS -b "$COOKIE_JAR" \
  -H "content-type: application/json" \
  -d '{
    "exportType":"assets",
    "idempotencyKey":"fe-export-001",
    "filters":{"status":"active"}
  }' \
  "$API/api/reports/exports"

curl -sS -b "$COOKIE_JAR" \
  -o /tmp/inventory-assets-export.json \
  "$API/api/reports/exports/<exportId>/download"
```

## Health, OpenAPI, Metrics

```bash
curl -sS "$API/api/health/live"
curl -sS "$API/api/health/ready"
curl -sS "$API/api/ops/status"
curl -sS "$API/api/openapi.json"
curl -sS "$API/api/metrics"
```
