import { logger } from "@custivio/telemetry";

import { runOnce, type WorkerMode } from "./worker";

export interface EmbeddedWorker {
  stop: () => Promise<void>;
}

function waitForNextTick(intervalMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, intervalMs);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

export function startEmbeddedWorker(intervalMs: number, mode: WorkerMode = "all"): EmbeddedWorker {
  const controller = new AbortController();

  const loop = (async () => {
    logger.info("Embedded worker loop started", {
      context: { intervalMs, mode },
    });

    while (!controller.signal.aborted) {
      try {
        await runOnce(mode);
      } catch (error) {
        logger.error("Embedded worker tick failed", {
          errorCode: "embedded_worker_failed",
          context: { error: error instanceof Error ? error.message : "Unknown worker error" },
        });
      }

      await waitForNextTick(intervalMs, controller.signal);
    }

    logger.info("Embedded worker loop stopped", { context: { mode } });
  })();

  return {
    stop: async () => {
      controller.abort();
      await loop;
    },
  };
}
