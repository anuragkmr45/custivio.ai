import { describe, expect, it } from "vitest";

import { readBootstrapInputFromEnvValues } from "./bootstrap-admin";

describe("bootstrap admin input validation", () => {
  it("requires every production bootstrap input", () => {
    expect(() => readBootstrapInputFromEnvValues({})).toThrow("BOOTSTRAP_TENANT_SLUG");
  });

  it("rejects weak bootstrap passwords", () => {
    expect(() =>
      readBootstrapInputFromEnvValues({
        BOOTSTRAP_TENANT_SLUG: "acme",
        BOOTSTRAP_TENANT_NAME: "Acme IT",
        BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
        BOOTSTRAP_ADMIN_NAME: "Admin User",
        BOOTSTRAP_ADMIN_PASSWORD: "weak-password",
      }),
    ).toThrow("BOOTSTRAP_ADMIN_PASSWORD");
  });

  it("rejects invalid tenant slugs", () => {
    expect(() =>
      readBootstrapInputFromEnvValues({
        BOOTSTRAP_TENANT_SLUG: "Acme Corp",
        BOOTSTRAP_TENANT_NAME: "Acme IT",
        BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
        BOOTSTRAP_ADMIN_NAME: "Admin User",
        BOOTSTRAP_ADMIN_PASSWORD: "StrongPassword123",
      }),
    ).toThrow("BOOTSTRAP_TENANT_SLUG");
  });

  it("returns normalized bootstrap inputs from explicit env values", () => {
    expect(
      readBootstrapInputFromEnvValues({
        BOOTSTRAP_TENANT_SLUG: "acme-it",
        BOOTSTRAP_TENANT_NAME: " Acme IT ",
        BOOTSTRAP_ADMIN_EMAIL: " Admin@Example.com ",
        BOOTSTRAP_ADMIN_NAME: " Admin User ",
        BOOTSTRAP_ADMIN_PASSWORD: "StrongPassword123",
      }),
    ).toEqual({
      tenantSlug: "acme-it",
      tenantName: "Acme IT",
      adminEmail: "Admin@Example.com",
      adminName: "Admin User",
      adminPassword: "StrongPassword123",
    });
  });
});
