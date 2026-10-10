import { getEnv, type AppEnv } from "@custivio/config";
import { GlideClient } from "@valkey/valkey-glide";

export function buildValkeyClientConfiguration(
  env: AppEnv,
): Parameters<typeof GlideClient.createClient>[0] {
  return {
    addresses: [{ host: env.VALKEY_HOST, port: env.VALKEY_PORT }],
    requestTimeout: env.HEALTHCHECK_TIMEOUT_MS,
    clientName: env.APP_NAME,
    useTLS: env.VALKEY_USE_TLS,
    ...(env.VALKEY_PASSWORD
      ? {
          credentials: {
            ...(env.VALKEY_USERNAME ? { username: env.VALKEY_USERNAME } : {}),
            password: env.VALKEY_PASSWORD,
          },
        }
      : {}),
  };
}

export async function createValkeyClient(): Promise<GlideClient> {
  const env = getEnv();

  return GlideClient.createClient(buildValkeyClientConfiguration(env));
}
