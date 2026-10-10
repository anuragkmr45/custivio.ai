import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const lists = new Map<string, string[]>();

vi.mock("./valkey-client", () => ({
  TimeUnit: {
    Milliseconds: "milliseconds",
    Seconds: "seconds",
  },
  createValkeyClient: vi.fn(() =>
    Promise.resolve({
      close: vi.fn(),
      del: vi.fn((keys: string[]) => {
        for (const key of keys) store.delete(key);

        return Promise.resolve();
      }),
      expire: vi.fn(() => Promise.resolve(true)),
      get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      incr: vi.fn((key: string) => {
        const next = Number(store.get(key) ?? "0") + 1;
        store.set(key, String(next));

        return Promise.resolve(next);
      }),
      lpop: vi.fn((key: string) => Promise.resolve(lists.get(key)?.shift() ?? null)),
      rpush: vi.fn((key: string, values: string[]) => {
        const existing = lists.get(key) ?? [];
        existing.push(...values);
        lists.set(key, existing);

        return Promise.resolve(existing.length);
      }),
      set: vi.fn((key: string, value: string, options?: { conditionalSet?: string }) => {
        if (options?.conditionalSet === "onlyIfDoesNotExist" && store.has(key)) {
          return Promise.resolve(null);
        }

        store.set(key, value);

        return Promise.resolve("OK");
      }),
      ttl: vi.fn(() => Promise.resolve(60)),
    }),
  ),
}));

describe("Valkey cache primitives", () => {
  beforeEach(() => {
    store.clear();
    lists.clear();
  });

  it("acquires and releases distributed locks by token", async () => {
    const { acquireLock, releaseLock } = await import("./locks");
    const first = await acquireLock({ key: "lock:test", ttlMs: 1000 });
    const second = await acquireLock({ key: "lock:test", ttlMs: 1000 });

    expect(first.acquired).toBe(true);
    expect(second.acquired).toBe(false);
    expect(await releaseLock(first)).toBe(true);
  });

  it("reserves idempotency keys and stores stable results", async () => {
    const { getIdempotencyRecord, reserveIdempotencyKey, storeIdempotencyResult } = await import(
      "./idempotency"
    );

    await expect(reserveIdempotencyKey("idem:test", 60)).resolves.toBe(true);
    await expect(reserveIdempotencyKey("idem:test", 60)).resolves.toBe(false);

    await storeIdempotencyResult("idem:test", { ok: true }, 60);

    await expect(getIdempotencyRecord("idem:test")).resolves.toMatchObject({
      key: "idem:test",
      result: { ok: true },
      state: "completed",
    });
  });

  it("enqueues and claims queue jobs FIFO", async () => {
    const { claimJob, enqueueJob } = await import("./queue");

    const job = await enqueueJob("imports", "import.process", { importJobId: "job-1" });

    await expect(claimJob("imports")).resolves.toMatchObject({
      id: job.id,
      payload: { importJobId: "job-1" },
      type: "import.process",
    });
    await expect(claimJob("imports")).resolves.toBeUndefined();
  });

  it("retries and dead-letters queue jobs", async () => {
    const { claimJob, enqueueJob, moveJobToDeadLetter, requeueJob } = await import("./queue");

    await enqueueJob("imports", "import.process", { importJobId: "job-1" });
    const claimed = await claimJob("imports");

    expect(claimed).toBeDefined();

    if (!claimed) {
      throw new Error("Expected queued import job.");
    }

    const retry = await requeueJob("imports", claimed, { attempts: 1 });

    expect(retry.attempts).toBe(1);
    await expect(claimJob("imports")).resolves.toMatchObject({ attempts: 1 });

    const deadLetter = await moveJobToDeadLetter("imports", retry, new Error("failed"));

    expect(deadLetter).toMatchObject({
      attempts: 1,
      errorMessage: "failed",
      type: "import.process",
    });
    expect(lists.get("queue:imports:dead-letter")).toHaveLength(1);
  });

  it("deduplicates queue jobs by idempotency key", async () => {
    const { claimJob, enqueueJob } = await import("./queue");

    const first = await enqueueJob(
      "imports",
      "import.process",
      { importJobId: "job-1" },
      { idempotencyKey: "same-request" },
    );
    const duplicate = await enqueueJob(
      "imports",
      "import.process",
      { importJobId: "job-1" },
      { idempotencyKey: "same-request" },
    );

    expect(duplicate.id).toBe(first.id);
    await expect(claimJob("imports")).resolves.toMatchObject({ id: first.id });
    await expect(claimJob("imports")).resolves.toBeUndefined();
  });
});
