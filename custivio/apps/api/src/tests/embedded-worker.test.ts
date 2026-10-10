import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runOnceMock } = vi.hoisted(() => ({
  runOnceMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("../workers/worker", () => ({
  runOnce: runOnceMock,
}));

import { startEmbeddedWorker } from "../workers/embedded-worker";

describe("embedded worker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    runOnceMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs immediately, repeats on the configured interval, and stops cleanly", async () => {
    const worker = startEmbeddedWorker(30_000, "all");

    await vi.advanceTimersByTimeAsync(0);
    expect(runOnceMock).toHaveBeenCalledTimes(1);
    expect(runOnceMock).toHaveBeenLastCalledWith("all");

    await vi.advanceTimersByTimeAsync(30_000);
    expect(runOnceMock).toHaveBeenCalledTimes(2);

    await worker.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(runOnceMock).toHaveBeenCalledTimes(2);
  });
});
