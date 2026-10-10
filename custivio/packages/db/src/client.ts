import { getEnv } from "@custivio/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

let pool: Pool | undefined;
let database: NodePgDatabase<typeof schema> | undefined;

export function getPostgresPool(): Pool {
  pool ??= new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: getEnv().DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: getEnv().HEALTHCHECK_TIMEOUT_MS,
    ...(getEnv().DATABASE_SSL ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  database ??= drizzle(getPostgresPool(), { schema });
  return database;
}

export async function closeDatabaseConnections(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
  database = undefined;
}
