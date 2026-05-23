import {
  acquireLock,
  claimJob,
  moveJobToDeadLetter,
  releaseLock,
  requeueJob,
  type QueueJob,
} from "@custivio/cache";
import { logger, recordWorkerJob } from "@custivio/telemetry";

export type WorkerRunStatus = "completed" | "dead_letter" | "idle" | "locked" | "retry";

export interface WorkerProcessor {
  process: (job: QueueJob) => Promise<void>;
  type: string;
}

type MaybePromise<T> = Promise<T> | T;

export interface WorkerHooks {
  onCompleted?: (job: QueueJob) => MaybePromise<void>;
  onDeadLetter?: (job: QueueJob, error: unknown, attempts: number) => MaybePromise<void>;
  onFailed?: (job: QueueJob, error: unknown, attempts: number) => MaybePromise<void>;
  onStarted?: (job: QueueJob) => MaybePromise<void>;
}

export interface WorkerRunResult {
  attempts?: number;
  errorMessage?: string;
  job?: QueueJob;
  status: WorkerRunStatus;
}

export interface RunNextWorkerJobInput {
  lockTtlMs?: number;
  processors: WorkerProcessor[];
  queueName: string;
  retryDelayMs?: number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown worker error";
}

function nextRunAfter(delayMs: number): string | undefined {
  if (delayMs <= 0) {
    return undefined;
  }

  return new Date(Date.now() + delayMs).toISOString();
}

function logContext(
  job: QueueJob,
  context: Record<string, unknown>,
): {
  context: Record<string, unknown>;
  requestId?: string;
  tenantId?: string;
  userId?: string;
} {
  return {
    context,
    ...(job.requestId ? { requestId: job.requestId } : {}),
    ...(job.tenantId ? { tenantId: job.tenantId } : {}),
    ...(job.actorUserId ? { userId: job.actorUserId } : {}),
  };
}

export async function runNextWorkerJob(
  input: RunNextWorkerJobInput,
  hooks: WorkerHooks = {},
): Promise<WorkerRunResult> {
  const job = await claimJob(input.queueName);

  if (!job) {
    return { status: "idle" };
  }

  const startedAt = performance.now();

  const lock = await acquireLock({
    key: job.lockKey ?? `worker:${input.queueName}:${job.id}`,
    ttlMs: input.lockTtlMs ?? 300_000,
  });

  if (!lock.acquired) {
    await requeueJob(input.queueName, job, {
      attempts: job.attempts,
      ...(job.runAfter ? { runAfter: job.runAfter } : {}),
    });
    recordWorkerJob({
      durationMs: Math.round(performance.now() - startedAt),
      queue: input.queueName,
      status: "locked",
      type: job.type,
    });

    return { job, status: "locked" };
  }

  const processor = input.processors.find((candidate) => candidate.type === job.type);

  try {
    if (!processor) {
      throw new Error(`No worker processor registered for ${job.type}.`);
    }

    await hooks.onStarted?.(job);
    await processor.process(job);
    await hooks.onCompleted?.(job);

    logger.info(
      "Worker job completed",
      logContext(job, { jobId: job.id, queueName: input.queueName, type: job.type }),
    );
    recordWorkerJob({
      durationMs: Math.round(performance.now() - startedAt),
      queue: input.queueName,
      status: "completed",
      type: job.type,
    });

    return { attempts: job.attempts, job, status: "completed" };
  } catch (error) {
    const attempts = job.attempts + 1;

    if (attempts >= job.maxAttempts) {
      await moveJobToDeadLetter(input.queueName, { ...job, attempts }, error);
      await hooks.onDeadLetter?.(job, error, attempts);

      logger.error("Worker job moved to dead letter", {
        ...logContext(job, {
          attempts,
          error: errorMessage(error),
          jobId: job.id,
          queueName: input.queueName,
          type: job.type,
        }),
        errorCode: "worker_dead_letter",
      });
      recordWorkerJob({
        durationMs: Math.round(performance.now() - startedAt),
        queue: input.queueName,
        status: "dead_letter",
        type: job.type,
      });

      return { attempts, errorMessage: errorMessage(error), job, status: "dead_letter" };
    }

    const runAfter = nextRunAfter(input.retryDelayMs ?? 5_000);

    await requeueJob(input.queueName, job, {
      attempts,
      ...(runAfter ? { runAfter } : {}),
    });
    await hooks.onFailed?.(job, error, attempts);

    logger.warn("Worker job scheduled for retry", {
      ...logContext(job, {
        attempts,
        error: errorMessage(error),
        jobId: job.id,
        queueName: input.queueName,
        type: job.type,
      }),
      errorCode: "worker_retry",
    });
    recordWorkerJob({
      durationMs: Math.round(performance.now() - startedAt),
      queue: input.queueName,
      status: "retry",
      type: job.type,
    });

    return { attempts, errorMessage: errorMessage(error), job, status: "retry" };
  } finally {
    await releaseLock(lock);
  }
}
