import { describe, expect, it } from "vitest";

import { parseEnv } from "./index";

describe("parseEnv", () => {
  it("applies development defaults", () => {
    const env = parseEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.VALKEY_PORT).toBe(6379);
    expect(env.MINIO_BUCKET).toBe("enterprise-inventory");
  });

  it("rejects invalid URLs", () => {
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow();
  });
});
