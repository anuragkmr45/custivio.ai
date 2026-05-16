import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDatabaseConnections, getDb } from "./client";

const migrationDirectory = join(dirname(fileURLToPath(import.meta.url)), "migrations");

try {
  await migrate(getDb(), { migrationsFolder: migrationDirectory });
} finally {
  await closeDatabaseConnections();
}
