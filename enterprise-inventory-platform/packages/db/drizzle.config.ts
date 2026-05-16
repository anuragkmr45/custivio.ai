import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://enterprise_inventory:enterprise_inventory_dev@localhost:5432/enterprise_inventory",
  },
  strict: true,
  verbose: true,
});
