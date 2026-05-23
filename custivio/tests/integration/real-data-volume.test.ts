import { performance } from "node:perf_hooks";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseConnections, getPostgresPool } from "@custivio/db";

const runVolumeTests = process.env.RUN_VOLUME_TESTS === "1";

function numbered(prefix: string, count: number, width = 3): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}-${index.toString().padStart(width, "0")}`,
  );
}

describe.skipIf(!runVolumeTests)("real data volume readiness", () => {
  afterAll(async () => {
    await closeDatabaseConnections();
  });

  it("handles customer-scale records with bounded page and aggregate queries", async () => {
    const pool = getPostgresPool();
    const client = await pool.connect();
    const prefix = `volume-${Date.now().toString()}`;
    const result = {
      assetTotal: 0,
      assetPageMs: 0,
      dashboardMs: 0,
      stockMs: 0,
      reportingMs: 0,
    };

    try {
      await client.query("begin");

      const tenantResult = await client.query<{ id: string }>(
        "insert into tenants (slug, name) values ($1, $2) returning id",
        [prefix, "Volume Test Tenant"],
      );
      const tenantId = tenantResult.rows[0]?.id;
      if (!tenantId) throw new Error("Failed to create volume test tenant.");

      const siteCodes = numbered("VOL-SITE", 100);
      const siteNames = siteCodes.map((code) => code.replace("VOL-SITE", "Volume Site"));
      const siteResult = await client.query<{ id: string; code: string }>(
        `
          insert into sites (tenant_id, code, name)
          select $1, code, name
          from unnest($2::text[], $3::text[]) as rows(code, name)
          returning id, code
        `,
        [tenantId, siteCodes, siteNames],
      );
      const siteIds = siteCodes.map((code) => {
        const site = siteResult.rows.find((row) => row.code === code);
        if (!site) throw new Error(`Missing inserted site ${code}.`);
        return site.id;
      });

      const buildingCodes = numbered("VOL-BLDG", 100);
      await client.query(
        `
          insert into buildings (tenant_id, site_id, code, name)
          select $1, site_id, code, name
          from unnest($2::uuid[], $3::text[], $4::text[]) as rows(site_id, code, name)
        `,
        [
          tenantId,
          siteIds,
          buildingCodes,
          buildingCodes.map((code) => code.replace("VOL-BLDG", "Volume Building")),
        ],
      );

      const userEmails = numbered("volume-user", 100).map((email) => `${email}@example.test`);
      await client.query(
        `
          insert into users (tenant_id, email, display_name, job_title, status)
          select $1, email, display_name, 'Volume Tester', 'active'
          from unnest($2::text[], $3::text[]) as rows(email, display_name)
        `,
        [
          tenantId,
          userEmails,
          userEmails.map((email, index) => `Volume User ${index.toString()} ${email}`),
        ],
      );

      const categoryResult = await client.query<{ id: string }>(
        "insert into asset_categories (tenant_id, key, name) values ($1, $2, $3) returning id",
        [tenantId, "volume-assets", "Volume Assets"],
      );
      const categoryId = categoryResult.rows[0]?.id;
      if (!categoryId) throw new Error("Failed to create volume category.");

      const typeResult = await client.query<{ id: string }>(
        "insert into asset_types (tenant_id, category_id, key, name) values ($1, $2, $3, $4) returning id",
        [tenantId, categoryId, "volume-device", "Volume Device"],
      );
      const assetTypeId = typeResult.rows[0]?.id;
      if (!assetTypeId) throw new Error("Failed to create volume asset type.");

      const assetTags = numbered("VOL-ASSET", 1_000, 4);
      const assetResult = await client.query<{ id: string; asset_tag: string }>(
        `
          insert into assets (
            tenant_id,
            asset_type_id,
            site_id,
            asset_tag,
            serial_number,
            name,
            status,
            condition
          )
          select $1, $2, site_id, asset_tag, serial_number, name, status, condition
          from unnest(
            $3::uuid[],
            $4::text[],
            $5::text[],
            $6::text[],
            $7::text[],
            $8::text[]
          ) as rows(site_id, asset_tag, serial_number, name, status, condition)
          returning id, asset_tag
        `,
        [
          tenantId,
          assetTypeId,
          assetTags.map((_, index) => siteIds[index % siteIds.length]),
          assetTags,
          assetTags.map((tag) => tag.replace("ASSET", "SERIAL")),
          assetTags.map((tag) => tag.replace("VOL-ASSET", "Volume Asset")),
          assetTags.map((_, index) => (index % 5 === 0 ? "in_use" : "in_stock")),
          assetTags.map((_, index) => (index % 7 === 0 ? "fair" : "good")),
        ],
      );
      const assetIds = assetTags.map((tag) => {
        const asset = assetResult.rows.find((row) => row.asset_tag === tag);
        if (!asset) throw new Error(`Missing inserted asset ${tag}.`);
        return asset.id;
      });

      const unitResult = await client.query<{ id: string }>(
        "insert into stock_units (tenant_id, code, name) values ($1, $2, $3) returning id",
        [tenantId, "VOL", "Volume Unit"],
      );
      const unitId = unitResult.rows[0]?.id;
      if (!unitId) throw new Error("Failed to create volume unit.");

      const stockSkus = numbered("VOL-SKU", 100);
      const stockItemResult = await client.query<{ id: string; sku: string }>(
        `
          insert into stock_items (tenant_id, unit_id, sku, name, item_type, low_stock_threshold)
          select $1, $2, sku, name, 'consumable', 10
          from unnest($3::text[], $4::text[]) as rows(sku, name)
          returning id, sku
        `,
        [
          tenantId,
          unitId,
          stockSkus,
          stockSkus.map((sku) => sku.replace("VOL-SKU", "Volume Stock Item")),
        ],
      );
      const stockItemIds = stockSkus.map((sku) => {
        const item = stockItemResult.rows.find((row) => row.sku === sku);
        if (!item) throw new Error(`Missing inserted stock item ${sku}.`);
        return item.id;
      });

      await client.query(
        `
          insert into stock_balances (tenant_id, stock_item_id, location_key, quantity_on_hand)
          select $1, stock_item_id, location_key, quantity_on_hand
          from unnest($2::uuid[], $3::text[], $4::int[]) as rows(stock_item_id, location_key, quantity_on_hand)
        `,
        [
          tenantId,
          stockItemIds,
          stockSkus.map((_, index) => siteCodes[index % siteCodes.length]),
          stockSkus.map((_, index) => 100 + index),
        ],
      );

      for (let offset = 0; offset < 10_000; offset += 1_000) {
        const rows = Array.from({ length: 1_000 }, (_, index) => offset + index);
        await client.query(
          `
            insert into stock_ledger_entries (
              tenant_id,
              stock_item_id,
              movement_type,
              quantity,
              to_location_key,
              reference_id,
              idempotency_key,
              metadata
            )
            select $1, stock_item_id, movement_type, quantity, location_key, reference_id, idempotency_key, metadata
            from unnest(
              $2::uuid[],
              $3::text[],
              $4::int[],
              $5::text[],
              $6::text[],
              $7::text[],
              $8::jsonb[]
            ) as rows(stock_item_id, movement_type, quantity, location_key, reference_id, idempotency_key, metadata)
          `,
          [
            tenantId,
            rows.map((row) => stockItemIds[row % stockItemIds.length]),
            rows.map((row) => (row % 2 === 0 ? "receive" : "issue")),
            rows.map((row) => 1 + (row % 20)),
            rows.map((row) => siteCodes[row % siteCodes.length]),
            rows.map((row) => `VOL-LEDGER-${row.toString()}`),
            rows.map((row) => `volume-ledger-${row.toString()}`),
            rows.map((row) => JSON.stringify({ source: "volume-test", row })),
          ],
        );
      }

      await client.query(
        `
          insert into asset_maintenance_tickets (
            tenant_id,
            asset_id,
            status,
            priority,
            issue_summary,
            downtime_minutes
          )
          select $1, asset_id, status, priority, issue_summary, downtime_minutes
          from unnest($2::uuid[], $3::text[], $4::text[], $5::text[], $6::int[])
            as rows(asset_id, status, priority, issue_summary, downtime_minutes)
        `,
        [
          tenantId,
          assetIds.slice(0, 100),
          Array.from({ length: 100 }, (_, index) => (index % 3 === 0 ? "resolved" : "open")),
          Array.from({ length: 100 }, (_, index) => (index % 5 === 0 ? "high" : "medium")),
          Array.from(
            { length: 100 },
            (_, index) => `Volume maintenance ticket ${index.toString()}`,
          ),
          Array.from({ length: 100 }, (_, index) => index),
        ],
      );

      await client.query(
        `
          insert into audit_campaigns (tenant_id, name, scope, status)
          select $1, name, 'all_assets', status
          from unnest($2::text[], $3::text[]) as rows(name, status)
        `,
        [
          tenantId,
          Array.from({ length: 20 }, (_, index) => `Volume Audit Campaign ${index.toString()}`),
          Array.from({ length: 20 }, (_, index) => (index % 2 === 0 ? "planned" : "completed")),
        ],
      );

      const importResult = await client.query<{ id: string; original_filename: string }>(
        `
          insert into import_jobs (
            tenant_id,
            import_type,
            status,
            original_filename,
            total_rows,
            processed_rows,
            idempotency_key
          )
          select $1, 'assets', 'processed', filename, 20, 20, idempotency_key
          from unnest($2::text[], $3::text[]) as rows(filename, idempotency_key)
          returning id, original_filename
        `,
        [
          tenantId,
          Array.from({ length: 5 }, (_, index) => `volume-import-${index.toString()}.json`),
          Array.from({ length: 5 }, (_, index) => `volume-import-${index.toString()}`),
        ],
      );

      for (const [jobIndex, job] of importResult.rows.entries()) {
        await client.query(
          `
            insert into import_job_rows (tenant_id, import_job_id, row_number, status, payload)
            select $1, $2, row_number, 'processed', payload
            from unnest($3::int[], $4::jsonb[]) as rows(row_number, payload)
          `,
          [
            tenantId,
            job.id,
            Array.from({ length: 20 }, (_, rowIndex) => rowIndex + 1),
            Array.from({ length: 20 }, (_, rowIndex) => JSON.stringify({ jobIndex, rowIndex })),
          ],
        );
      }

      await client.query(
        `
          insert into export_jobs (
            tenant_id,
            export_type,
            status,
            filename,
            object_key,
            content_length,
            idempotency_key
          )
          select $1, 'assets', 'completed', filename, object_key, content_length, idempotency_key
          from unnest($2::text[], $3::text[], $4::int[], $5::text[]) as rows(filename, object_key, content_length, idempotency_key)
        `,
        [
          tenantId,
          Array.from({ length: 5 }, (_, index) => `volume-export-${index.toString()}.json`),
          Array.from({ length: 5 }, (_, index) => `volume/export-${index.toString()}.json`),
          Array.from({ length: 5 }, (_, index) => 1024 + index),
          Array.from({ length: 5 }, (_, index) => `volume-export-${index.toString()}`),
        ],
      );

      await client.query(
        `
          insert into saved_filters (tenant_id, module, key, name, filters)
          select $1, 'assets', key, name, filters
          from unnest($2::text[], $3::text[], $4::jsonb[]) as rows(key, name, filters)
        `,
        [
          tenantId,
          Array.from({ length: 10 }, (_, index) => `volume-filter-${index.toString()}`),
          Array.from({ length: 10 }, (_, index) => `Volume Filter ${index.toString()}`),
          Array.from({ length: 10 }, () => JSON.stringify({ status: "in_stock" })),
        ],
      );

      const assetPageStart = performance.now();
      const assetTotalResult = await client.query<{ value: string }>(
        "select count(*)::int as value from assets where tenant_id = $1 and asset_tag ilike 'VOL-ASSET-%'",
        [tenantId],
      );
      const assetPageResult = await client.query<{ id: string; asset_tag: string }>(
        `
          select id, asset_tag
          from assets
          where tenant_id = $1 and asset_tag ilike 'VOL-ASSET-%'
          order by asset_tag
          limit 50 offset 950
        `,
        [tenantId],
      );
      const assetPageMs = performance.now() - assetPageStart;

      const dashboardStart = performance.now();
      const dashboardResult = await client.query<{ assets: string; users: string }>(
        `
          select
            (select count(*)::int from assets where tenant_id = $1) as assets,
            (select count(*)::int from users where tenant_id = $1) as users
        `,
        [tenantId],
      );
      const dashboardMs = performance.now() - dashboardStart;

      const stockStart = performance.now();
      const stockResult = await client.query<{ items: string; ledger_rows: string }>(
        `
          select
            (select count(*)::int from stock_items where tenant_id = $1) as items,
            (select count(*)::int from stock_ledger_entries where tenant_id = $1) as ledger_rows
        `,
        [tenantId],
      );
      const stockMs = performance.now() - stockStart;

      const reportingStart = performance.now();
      const reportingResult = await client.query<{
        campaigns: string;
        imports: string;
        exports: string;
      }>(
        `
          select
            (select count(*)::int from audit_campaigns where tenant_id = $1) as campaigns,
            (select count(*)::int from import_jobs where tenant_id = $1) as imports,
            (select count(*)::int from export_jobs where tenant_id = $1) as exports
        `,
        [tenantId],
      );
      const reportingMs = performance.now() - reportingStart;

      const assetTotal = Number(assetTotalResult.rows[0]?.value ?? 0);
      const dashboardCounts = dashboardResult.rows[0];
      const stockCounts = stockResult.rows[0];
      const reportingCounts = reportingResult.rows[0];

      expect(assetTotal).toBe(1_000);
      expect(assetPageResult.rows).toHaveLength(50);
      expect(Number(dashboardCounts?.assets ?? 0)).toBe(1_000);
      expect(Number(dashboardCounts?.users ?? 0)).toBe(100);
      expect(Number(stockCounts?.items ?? 0)).toBe(100);
      expect(Number(stockCounts?.ledger_rows ?? 0)).toBe(10_000);
      expect(Number(reportingCounts?.campaigns ?? 0)).toBe(20);
      expect(Number(reportingCounts?.imports ?? 0)).toBe(5);
      expect(Number(reportingCounts?.exports ?? 0)).toBe(5);

      result.assetTotal = assetTotal;
      result.assetPageMs = assetPageMs;
      result.dashboardMs = dashboardMs;
      result.stockMs = stockMs;
      result.reportingMs = reportingMs;
    } finally {
      await client.query("rollback");
      client.release();
    }

    expect(result.assetTotal).toBe(1_000);
    expect(result.assetPageMs).toBeLessThan(5_000);
    expect(result.dashboardMs).toBeLessThan(5_000);
    expect(result.stockMs).toBeLessThan(5_000);
    expect(result.reportingMs).toBeLessThan(5_000);
  });
});
