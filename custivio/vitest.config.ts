import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@custivio/auth": new URL("./packages/auth/src/index.ts", import.meta.url).pathname,
      "@custivio/cache": new URL("./packages/cache/src/index.ts", import.meta.url).pathname,
      "@custivio/config": new URL("./packages/config/src/index.ts", import.meta.url).pathname,
      "@custivio/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@custivio/db": new URL("./packages/db/src/index.ts", import.meta.url).pathname,
      "@custivio/storage": new URL("./packages/storage/src/index.ts", import.meta.url).pathname,
      "@custivio/telemetry": new URL("./packages/telemetry/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["apps/api/src/tests/**/*.test.ts", "packages/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json"],
    },
  },
});
