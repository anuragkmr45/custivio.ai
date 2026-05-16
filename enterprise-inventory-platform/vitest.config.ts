import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@enterprise-inventory/auth": new URL("./packages/auth/src/index.ts", import.meta.url)
        .pathname,
      "@enterprise-inventory/cache": new URL("./packages/cache/src/index.ts", import.meta.url)
        .pathname,
      "@enterprise-inventory/config": new URL("./packages/config/src/index.ts", import.meta.url)
        .pathname,
      "@enterprise-inventory/core": new URL("./packages/core/src/index.ts", import.meta.url)
        .pathname,
      "@enterprise-inventory/db": new URL("./packages/db/src/index.ts", import.meta.url).pathname,
      "@enterprise-inventory/storage": new URL("./packages/storage/src/index.ts", import.meta.url)
        .pathname,
      "@enterprise-inventory/telemetry": new URL(
        "./packages/telemetry/src/index.ts",
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json"],
    },
  },
});
