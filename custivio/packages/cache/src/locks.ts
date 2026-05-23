import { randomUUID } from "node:crypto";

import { TimeUnit } from "@valkey/valkey-glide";

import { createValkeyClient } from "./valkey-client";

export interface LockHandle {
  key: string;
  token: string;
  acquired: boolean;
}

export interface AcquireLockInput {
  key: string;
  ttlMs: number;
}

export async function acquireLock(input: AcquireLockInput): Promise<LockHandle> {
  const client = await createValkeyClient();
  const token = randomUUID();

  try {
    const result = await client.set(input.key, token, {
      conditionalSet: "onlyIfDoesNotExist",
      expiry: {
        type: TimeUnit.Milliseconds,
        count: Math.max(1, Math.floor(input.ttlMs)),
      },
    });

    return {
      key: input.key,
      token,
      acquired: result === "OK",
    };
  } finally {
    client.close();
  }
}

export async function releaseLock(handle: LockHandle): Promise<boolean> {
  if (!handle.acquired) {
    return false;
  }

  const client = await createValkeyClient();

  try {
    const existingToken = await client.get(handle.key);

    if (existingToken !== handle.token) {
      return false;
    }

    await client.del([handle.key]);

    return true;
  } finally {
    client.close();
  }
}

export async function withLock<T>(
  input: AcquireLockInput,
  run: () => Promise<T>,
): Promise<T | undefined> {
  const lock = await acquireLock(input);

  if (!lock.acquired) {
    return undefined;
  }

  try {
    return await run();
  } finally {
    await releaseLock(lock);
  }
}
