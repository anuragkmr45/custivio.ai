import { getEnv, type AppEnv } from "@custivio/config";
import Redis, { type RedisOptions } from "ioredis";

export type ValkeyClientConfiguration = Omit<RedisOptions, "replyMapping">;

export const TimeUnit = {
  Milliseconds: "milliseconds",
  Seconds: "seconds",
} as const;

type TimeUnitValue = (typeof TimeUnit)[keyof typeof TimeUnit];

export interface ValkeySetOptions {
  conditionalSet?: "onlyIfDoesNotExist";
  expiry?: {
    type: TimeUnitValue;
    count: number;
  };
}

export class ValkeyClient {
  public constructor(private readonly client: Redis) {}

  public close(): void {
    this.client.disconnect();
  }

  public del(keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  public expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  public get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  public lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  public ping(): Promise<string> {
    return this.client.ping();
  }

  public rpush(key: string, values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  public set(key: string, value: string, options: ValkeySetOptions = {}): Promise<"OK" | null> {
    const onlyIfMissing = options.conditionalSet === "onlyIfDoesNotExist";
    const expiry = options.expiry;

    if (expiry?.type === TimeUnit.Seconds) {
      return onlyIfMissing
        ? this.client.set(key, value, "EX", expiry.count, "NX")
        : this.client.set(key, value, "EX", expiry.count);
    }

    if (expiry?.type === TimeUnit.Milliseconds) {
      return onlyIfMissing
        ? this.client.set(key, value, "PX", expiry.count, "NX")
        : this.client.set(key, value, "PX", expiry.count);
    }

    return onlyIfMissing ? this.client.set(key, value, "NX") : this.client.set(key, value);
  }

  public ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}

export function buildValkeyClientConfiguration(env: AppEnv): ValkeyClientConfiguration {
  return {
    commandTimeout: env.HEALTHCHECK_TIMEOUT_MS,
    connectTimeout: env.HEALTHCHECK_TIMEOUT_MS,
    connectionName: env.APP_NAME,
    enableOfflineQueue: true,
    host: env.VALKEY_HOST,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    port: env.VALKEY_PORT,
    retryStrategy: () => null,
    ...(env.VALKEY_USERNAME ? { username: env.VALKEY_USERNAME } : {}),
    ...(env.VALKEY_PASSWORD ? { password: env.VALKEY_PASSWORD } : {}),
    ...(env.VALKEY_USE_TLS ? { tls: { servername: env.VALKEY_HOST } } : {}),
  };
}

export function createValkeyClient(): Promise<ValkeyClient> {
  const env = getEnv();

  return Promise.resolve(new ValkeyClient(new Redis(buildValkeyClientConfiguration(env))));
}
