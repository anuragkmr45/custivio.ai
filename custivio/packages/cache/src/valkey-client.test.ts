import { parseEnv } from "@custivio/config";
import { describe, expect, it } from "vitest";

import { buildValkeyClientConfiguration } from "./valkey-client";

describe("Valkey client configuration", () => {
  it("preserves the local unauthenticated connection defaults", () => {
    const configuration = buildValkeyClientConfiguration(parseEnv({}));

    expect(configuration).toMatchObject({
      addresses: [{ host: "localhost", port: 6379 }],
      useTLS: false,
    });
    expect(configuration.credentials).toBeUndefined();
  });

  it("enables TLS and password authentication for a managed endpoint", () => {
    const configuration = buildValkeyClientConfiguration(
      parseEnv({
        VALKEY_HOST: "example.upstash.io",
        VALKEY_PORT: "6379",
        VALKEY_PASSWORD: "secret-token",
        VALKEY_USE_TLS: "true",
      }),
    );

    expect(configuration).toMatchObject({
      addresses: [{ host: "example.upstash.io", port: 6379 }],
      credentials: { password: "secret-token" },
      useTLS: true,
    });
  });
});
