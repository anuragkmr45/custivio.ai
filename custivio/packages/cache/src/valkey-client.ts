import { getEnv } from "@custivio/config";
import { GlideClient } from "@valkey/valkey-glide";

export async function createValkeyClient(): Promise<GlideClient> {
  const env = getEnv();

  return GlideClient.createClient({
    addresses: [{ host: env.VALKEY_HOST, port: env.VALKEY_PORT }],
    requestTimeout: env.HEALTHCHECK_TIMEOUT_MS,
    clientName: env.APP_NAME,
  });
}
