import { describe, expect, it } from "vitest";

import { closeDatabaseConnections, getPostgresPool, seedDatabase } from "@custivio/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("database seed idempotency", () => {
  it("does not duplicate the default tenant or seed audit log", async () => {
    await seedDatabase();
    await seedDatabase();

    const pool = getPostgresPool();
    const tenantCounts = await pool.query<{ count: number }>(
      "select count(*)::int as count from tenants where slug = 'default'",
    );
    const seedLogCounts = await pool.query<{ count: number }>(
      `
        select count(*)::int as count
        from audit_logs
        where action = 'system.seed'
          and entity_type = 'tenant'
      `,
    );

    await closeDatabaseConnections();

    expect(tenantCounts.rows[0]?.count ?? 0).toBe(1);
    expect(seedLogCounts.rows[0]?.count ?? 0).toBe(1);
  });
});
