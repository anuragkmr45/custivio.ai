import { parseEnv } from "@custivio/config";
import { describe, expect, it } from "vitest";

import { buildValkeyClientConfiguration } from "./valkey-client";

describe("Valkey client configuration", () => {
  it("preserves the local unauthenticated connection defaults", () => {
    const configuration = buildValkeyClientConfiguration(parseEnv({}));

    expect(configuration).toMatchObject({
      host: "localhost",
      port: 6379,
    });
    expect(configuration.password).toBeUndefined();
    expect(configuration.tls).toBeUndefined();
    expect(configuration.username).toBeUndefined();
  });

  it("enables TLS and password authentication for a managed endpoint", () => {
    const configuration = buildValkeyClientConfiguration(
      parseEnv({
        VALKEY_HOST: "example.upstash.io",
        VALKEY_PORT: "6379",
        VALKEY_PASSWORD: "secret-token",
        VALKEY_USERNAME: "default",
        VALKEY_USE_TLS: "true",
      }),
    );

    expect(configuration).toMatchObject({
      host: "example.upstash.io",
      password: "secret-token",
      port: 6379,
      tls: { servername: "example.upstash.io" },
      username: "default",
    });
  });
});
