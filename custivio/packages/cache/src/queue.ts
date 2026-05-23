import { randomUUID } from "node:crypto";

import { TimeUnit } from "@valkey/valkey-glide";

import { createValkeyClient } from "./valkey-client";

export interface QueueJob<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  enqueuedAt: string;
  actorUserId?: string;
  idempotencyKey?: string;
  lockKey?: string;
  requestId?: string;
  runAfter?: string;
  tenantId?: string;
}

export interface EnqueueJobOptions {
  actorUserId?: string;
  id?: string;
  idempotencyKey?: string;
  lockKey?: string;
  maxAttempts?: number;
  requestId?: string;
  runAfter?: string;
  tenantId?: string;
}

export interface DeadLetterJob<TPayload = Record<string, unknown>> extends QueueJob<TPayload> {
  deadLetteredAt: string;
  errorMessage: string;
}

function queueIdempotencyKey(queueName: string, idempotencyKey: string): string {
  return `queue:${queueName}:idempotency:${idempotencyKey}`;
}

function parseQueueJob<TPayload>(raw: string): QueueJob<TPayload> {
  return JSON.parse(raw) as QueueJob<TPayload>;
}

export async function enqueueJob<TPayload extends Record<string, unknown>>(
  queueName: string,
  type: string,
  payload: TPayload,
  options: EnqueueJobOptions = {},
): Promise<QueueJob<TPayload>> {
  const client = await createValkeyClient();
  const job: QueueJob<TPayload> = {
    id: options.id ?? randomUUID(),
    type,
    payload,
    attempts: 0,
    maxAttempts: Math.max(1, options.maxAttempts ?? 3),
    enqueuedAt: new Date().toISOString(),
    ...(options.actorUserId ? { actorUserId: options.actorUserId } : {}),
    ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
    ...(options.lockKey ? { lockKey: options.lockKey } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.runAfter ? { runAfter: options.runAfter } : {}),
    ...(options.tenantId ? { tenantId: options.tenantId } : {}),
  };

  try {
    if (options.idempotencyKey) {
      const key = queueIdempotencyKey(queueName, options.idempotencyKey);
      const existing = await client.get(key);

      if (typeof existing === "string") {
        return parseQueueJob<TPayload>(existing);
      }

      const reservation = await client.set(key, JSON.stringify(job), {
        conditionalSet: "onlyIfDoesNotExist",
        expiry: {
          type: TimeUnit.Seconds,
          count: 86_400,
        },
      });

      if (reservation !== "OK") {
        const reserved = await client.get(key);

        if (typeof reserved === "string") {
          return parseQueueJob<TPayload>(reserved);
        }
      }
    }

    await client.rpush(`queue:${queueName}`, [JSON.stringify(job)]);

    return job;
  } finally {
    client.close();
  }
}

export async function requeueJob<TPayload extends Record<string, unknown>>(
  queueName: string,
  job: QueueJob<TPayload>,
  input: { attempts: number; runAfter?: string },
): Promise<QueueJob<TPayload>> {
  const client = await createValkeyClient();
  const nextJob: QueueJob<TPayload> = {
    ...job,
    attempts: input.attempts,
    ...(input.runAfter ? { runAfter: input.runAfter } : {}),
  };

  try {
    await client.rpush(`queue:${queueName}`, [JSON.stringify(nextJob)]);

    return nextJob;
  } finally {
    client.close();
  }
}

export async function moveJobToDeadLetter<TPayload extends Record<string, unknown>>(
  queueName: string,
  job: QueueJob<TPayload>,
  error: unknown,
): Promise<DeadLetterJob<TPayload>> {
  const client = await createValkeyClient();
  const deadLetterJob: DeadLetterJob<TPayload> = {
    ...job,
    deadLetteredAt: new Date().toISOString(),
    errorMessage: error instanceof Error ? error.message : "Unknown worker error",
  };

  try {
    await client.rpush(`queue:${queueName}:dead-letter`, [JSON.stringify(deadLetterJob)]);

    return deadLetterJob;
  } finally {
    client.close();
  }
}

export async function claimJob<TPayload extends Record<string, unknown>>(
  queueName: string,
): Promise<QueueJob<TPayload> | undefined> {
  const client = await createValkeyClient();

  try {
    const raw = await client.lpop(`queue:${queueName}`);

    if (!raw || typeof raw !== "string") {
      return undefined;
    }

    const job = parseQueueJob<TPayload>(raw);

    if (job.runAfter && new Date(job.runAfter).getTime() > Date.now()) {
      await client.rpush(`queue:${queueName}`, [JSON.stringify(job)]);

      return undefined;
    }

    return job;
  } finally {
    client.close();
  }
}
