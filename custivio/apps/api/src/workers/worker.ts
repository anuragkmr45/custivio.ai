import { logger } from "@custivio/telemetry";

import { logDeadLetterResult } from "./dead-letter";
import { runExportWorkerOnce } from "./export-worker";
import { runImportWorkerOnce } from "./import-worker";

import type { WorkerRunResult } from "./job-runner";

type WorkerMode = "all" | "exports" | "imports";

function resultLogFields(result: WorkerRunResult): {
  requestId?: string;
  tenantId?: string;
  userId?: string;
} {
  return {
    ...(result.job?.requestId ? { requestId: result.job.requestId } : {}),
    ...(result.job?.tenantId ? { tenantId: result.job.tenantId } : {}),
    ...(result.job?.actorUserId ? { userId: result.job.actorUserId } : {}),
  };
}

function printHelp(): void {
  process.stdout.write(`Custivio worker

Usage:
  pnpm worker -- [--once] [--queue imports|exports|all] [--interval-ms 5000]
  pnpm worker -- --help

Options:
  --once              Process at most one job and exit.
  --queue <name>      Queue to process. Defaults to all.
  --interval-ms <ms>  Continuous loop sleep interval. Defaults to 5000.
  --help              Show this help text.
`);
}

function readQueueMode(args: string[]): WorkerMode {
  const queueIndex = args.indexOf("--queue");
  const requested = queueIndex >= 0 ? args[queueIndex + 1] : "all";

  if (requested === "all" || requested === "imports" || requested === "exports") {
    return requested;
  }

  throw new Error("--queue must be all, imports, or exports.");
}

function readIntervalMs(args: string[]): number {
  const intervalIndex = args.indexOf("--interval-ms");
  const requested = intervalIndex >= 0 ? args[intervalIndex + 1] : "5000";
  const intervalMs = Number(requested);

  if (!Number.isInteger(intervalMs) || intervalMs < 1000) {
    throw new Error("--interval-ms must be an integer greater than or equal to 1000.");
  }

  return intervalMs;
}

function sleep(intervalMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, intervalMs);
  });
}

async function runSingleQueue(mode: Exclude<WorkerMode, "all">): Promise<void> {
  const result = mode === "imports" ? await runImportWorkerOnce() : await runExportWorkerOnce();

  logDeadLetterResult(result);
  logger.info("Worker tick completed", {
    ...resultLogFields(result),
    context: {
      mode,
      status: result.status,
      jobId: result.job?.id,
    },
  });
}

async function runOnce(mode: WorkerMode): Promise<void> {
  if (mode === "all") {
    await runSingleQueue("imports");
    await runSingleQueue("exports");
    return;
  }

  await runSingleQueue(mode);
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const mode = readQueueMode(args);
  const intervalMs = readIntervalMs(args);

  if (args.includes("--once")) {
    await runOnce(mode);
    return;
  }

  logger.info("Worker loop started", {
    context: { intervalMs, mode },
  });

  for (;;) {
    await runOnce(mode);
    await sleep(intervalMs);
  }
}

const entrypointUrl = process.argv[1] ? `file://${process.argv[1]}` : "";

if (import.meta.url === entrypointUrl) {
  main().catch((error: unknown) => {
    logger.error("Worker failed", {
      errorCode: "worker_failed",
      context: { error: error instanceof Error ? error.message : "Unknown worker error" },
    });
    process.exitCode = 1;
  });
}
