import { createValkeyClient, TimeUnit } from "./valkey-client";

export type IdempotencyState = "processing" | "completed";

export interface IdempotencyRecord<T = unknown> {
  key: string;
  state: IdempotencyState;
  result?: T;
}

export async function getIdempotencyRecord<T = unknown>(
  key: string,
): Promise<IdempotencyRecord<T> | undefined> {
  const client = await createValkeyClient();

  try {
    const raw = await client.get(key);

    if (!raw || typeof raw !== "string") {
      return undefined;
    }

    return JSON.parse(raw) as IdempotencyRecord<T>;
  } finally {
    client.close();
  }
}

export async function reserveIdempotencyKey(key: string, ttlSeconds: number): Promise<boolean> {
  const client = await createValkeyClient();

  try {
    const result = await client.set(
      key,
      JSON.stringify({ key, state: "processing" } satisfies IdempotencyRecord),
      {
        conditionalSet: "onlyIfDoesNotExist",
        expiry: {
          type: TimeUnit.Seconds,
          count: Math.max(1, Math.floor(ttlSeconds)),
        },
      },
    );

    return result === "OK";
  } finally {
    client.close();
  }
}

export async function storeIdempotencyResult(
  key: string,
  result: unknown,
  ttlSeconds: number,
): Promise<void> {
  const client = await createValkeyClient();

  try {
    await client.set(
      key,
      JSON.stringify({ key, state: "completed", result } satisfies IdempotencyRecord),
      {
        expiry: {
          type: TimeUnit.Seconds,
          count: Math.max(1, Math.floor(ttlSeconds)),
        },
      },
    );
  } finally {
    client.close();
  }
}
