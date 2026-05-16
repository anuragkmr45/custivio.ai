import { sql } from "drizzle-orm";

import { getDb } from "./client";

export interface DependencyHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function checkPostgresHealth(): Promise<DependencyHealth> {
  const startedAt = performance.now();

  try {
    await getDb().execute(sql`select 1`);

    return {
      ok: true,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : "Unknown PostgreSQL error",
    };
  }
}
