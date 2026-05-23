import { describe, expect, it } from "vitest";

import { parseEnv } from "./index";

describe("parseEnv", () => {
  it("applies development defaults", () => {
    const env = parseEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.VALKEY_PORT).toBe(6379);
    expect(env.MINIO_BUCKET).toBe("custivio");
    expect(env.UAT_ADMIN_EMAIL).toBeUndefined();
    expect(env.UAT_SEED_PASSWORD).toBeUndefined();
  });

  it("parses local UAT seed credentials from environment", () => {
    const env = parseEnv({
      UAT_ADMIN_EMAIL: "admin@example.test",
      UAT_MANAGER_EMAIL: "manager@example.test",
      UAT_STORE_EMAIL: "store@example.test",
      UAT_TECHNICIAN_EMAIL: "tech@example.test",
      UAT_APPROVER_EMAIL: "approver@example.test",
      UAT_AUDITOR_EMAIL: "auditor@example.test",
      UAT_VIEWER_EMAIL: "viewer@example.test",
      UAT_SEED_PASSWORD: "LocalOnlyPass1!",
    });

    expect(env.UAT_ADMIN_EMAIL).toBe("admin@example.test");
    expect(env.UAT_MANAGER_EMAIL).toBe("manager@example.test");
    expect(env.UAT_STORE_EMAIL).toBe("store@example.test");
    expect(env.UAT_TECHNICIAN_EMAIL).toBe("tech@example.test");
    expect(env.UAT_APPROVER_EMAIL).toBe("approver@example.test");
    expect(env.UAT_AUDITOR_EMAIL).toBe("auditor@example.test");
    expect(env.UAT_VIEWER_EMAIL).toBe("viewer@example.test");
    expect(env.UAT_SEED_PASSWORD).toBe("LocalOnlyPass1!");
  });

  it("parses production bootstrap credentials from environment", () => {
    const env = parseEnv({
      BOOTSTRAP_TENANT_SLUG: "acme",
      BOOTSTRAP_TENANT_NAME: "Acme IT",
      BOOTSTRAP_ADMIN_EMAIL: "admin@acme.example",
      BOOTSTRAP_ADMIN_NAME: "Acme Admin",
      BOOTSTRAP_ADMIN_PASSWORD: "BootstrapPass1!",
    });

    expect(env.BOOTSTRAP_TENANT_SLUG).toBe("acme");
    expect(env.BOOTSTRAP_TENANT_NAME).toBe("Acme IT");
    expect(env.BOOTSTRAP_ADMIN_EMAIL).toBe("admin@acme.example");
    expect(env.BOOTSTRAP_ADMIN_NAME).toBe("Acme Admin");
    expect(env.BOOTSTRAP_ADMIN_PASSWORD).toBe("BootstrapPass1!");
  });

  it("rejects invalid URLs", () => {
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow();
  });
});
