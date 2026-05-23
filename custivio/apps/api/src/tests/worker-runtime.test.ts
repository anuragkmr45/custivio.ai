import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeadLetterJob, LockHandle, QueueJob } from "@custivio/cache";

interface QueueTestState {
  deadLetters: DeadLetterJob[];
  locks: Set<string>;
  queues: Map<string, QueueJob[]>;
}

const queueState: QueueTestState = {
  deadLetters: [],
  locks: new Set(),
  queues: new Map(),
};

vi.mock("@custivio/cache", () => ({
  __queueTestState: queueState,
  acquireLock: vi.fn((input: { key: string }): Promise<LockHandle> => {
    if (queueState.locks.has(input.key)) {
      return Promise.resolve({ acquired: false, key: input.key, token: "locked" });
    }

    queueState.locks.add(input.key);

    return Promise.resolve({ acquired: true, key: input.key, token: "token" });
  }),
  claimJob: vi.fn((queueName: string): Promise<QueueJob | undefined> => {
    const queue = queueState.queues.get(queueName) ?? [];

    return Promise.resolve(queue.shift());
  }),
  enqueueJob: vi.fn(
    (
      queueName: string,
      type: string,
      payload: Record<string, unknown>,
      options?: { id?: string; maxAttempts?: number },
    ): Promise<QueueJob> => {
      const job: QueueJob = {
        attempts: 0,
        enqueuedAt: new Date().toISOString(),
        id: options?.id ?? crypto.randomUUID(),
        maxAttempts: options?.maxAttempts ?? 3,
        payload,
        type,
      };
      const queue = queueState.queues.get(queueName) ?? [];

      queue.push(job);
      queueState.queues.set(queueName, queue);

      return Promise.resolve(job);
    },
  ),
  moveJobToDeadLetter: vi.fn(
    (queueName: string, job: QueueJob, error: unknown): Promise<DeadLetterJob> => {
      const deadLetter: DeadLetterJob = {
        ...job,
        deadLetteredAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : "Unknown worker error",
      };

      queueState.deadLetters.push(deadLetter);
      queueState.queues.set(`dead:${queueName}`, [deadLetter]);

      return Promise.resolve(deadLetter);
    },
  ),
  releaseLock: vi.fn((handle: LockHandle): Promise<boolean> => {
    queueState.locks.delete(handle.key);

    return Promise.resolve(true);
  }),
  requeueJob: vi.fn(
    (
      queueName: string,
      job: QueueJob,
      input: { attempts: number; runAfter?: string },
    ): Promise<QueueJob> => {
      const retry: QueueJob = {
        ...job,
        attempts: input.attempts,
        ...(input.runAfter ? { runAfter: input.runAfter } : {}),
      };
      const queue = queueState.queues.get(queueName) ?? [];

      queue.push(retry);
      queueState.queues.set(queueName, queue);

      return Promise.resolve(retry);
    },
  ),
}));

describe("worker runtime", () => {
  beforeEach(() => {
    queueState.deadLetters = [];
    queueState.locks.clear();
    queueState.queues.clear();
    vi.clearAllMocks();
  });

  it("processes a queued job successfully", async () => {
    const { enqueueJob } = await import("@custivio/cache");
    const { runNextWorkerJob } = await import("../workers/job-runner");
    const processed: string[] = [];

    await enqueueJob("imports", "demo.process", { importJobId: "job-1" });

    const result = await runNextWorkerJob({
      processors: [
        {
          type: "demo.process",
          process(job) {
            processed.push(String(job.payload.importJobId));

            return Promise.resolve();
          },
        },
      ],
      queueName: "imports",
    });

    expect(result.status).toBe("completed");
    expect(processed).toEqual(["job-1"]);
  });

  it("retries a failed job before max attempts", async () => {
    const { enqueueJob } = await import("@custivio/cache");
    const { runNextWorkerJob } = await import("../workers/job-runner");

    await enqueueJob("imports", "demo.process", { importJobId: "job-1" }, { maxAttempts: 2 });

    const result = await runNextWorkerJob({
      processors: [
        {
          type: "demo.process",
          process() {
            return Promise.reject(new Error("temporary failure"));
          },
        },
      ],
      queueName: "imports",
      retryDelayMs: 0,
    });

    expect(result).toMatchObject({
      attempts: 1,
      errorMessage: "temporary failure",
      status: "retry",
    });
    expect(queueState.queues.get("imports")?.[0]).toMatchObject({ attempts: 1 });
  });

  it("dead-letters a failed job at max attempts", async () => {
    const { enqueueJob } = await import("@custivio/cache");
    const { runNextWorkerJob } = await import("../workers/job-runner");

    await enqueueJob("imports", "demo.process", { importJobId: "job-1" }, { maxAttempts: 1 });

    const result = await runNextWorkerJob({
      processors: [
        {
          type: "demo.process",
          process() {
            return Promise.reject(new Error("permanent failure"));
          },
        },
      ],
      queueName: "imports",
    });

    expect(result).toMatchObject({
      attempts: 1,
      errorMessage: "permanent failure",
      status: "dead_letter",
    });
    expect(queueState.deadLetters).toHaveLength(1);
  });

  it("requeues when a duplicate worker cannot acquire the lock", async () => {
    const { enqueueJob } = await import("@custivio/cache");
    const { runNextWorkerJob } = await import("../workers/job-runner");

    await enqueueJob(
      "imports",
      "demo.process",
      { importJobId: "job-1" },
      { id: "locked-job", maxAttempts: 1 },
    );
    queueState.locks.add("worker:imports:locked-job");

    const result = await runNextWorkerJob({
      processors: [{ type: "demo.process", process: () => Promise.resolve() }],
      queueName: "imports",
    });

    expect(result.status).toBe("locked");
    expect(queueState.queues.get("imports")).toHaveLength(1);
  });
});
