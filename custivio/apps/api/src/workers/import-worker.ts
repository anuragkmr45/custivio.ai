import { processImportJob, updateImportJobWorkerState } from "@custivio/db";
import { recordImportJob } from "@custivio/telemetry";

import { runNextWorkerJob, type WorkerHooks, type WorkerProcessor } from "./job-runner";

import type { QueueJob } from "@custivio/cache";

export const importQueueName = "imports";
export const importProcessJobType = "import.process";

function readRequiredPayloadString(job: QueueJob, key: string): string {
  const value = job.payload[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required for ${job.type}.`);
  }

  return value;
}

function importJobFields(job: QueueJob): { importJobId: string; tenantId: string } {
  return {
    importJobId: readRequiredPayloadString(job, "importJobId"),
    tenantId: job.tenantId ?? readRequiredPayloadString(job, "tenantId"),
  };
}

function requestIdField(job: QueueJob): { requestId?: string } {
  return job.requestId ? { requestId: job.requestId } : {};
}

export const importWorkerProcessor: WorkerProcessor = {
  type: importProcessJobType,
  async process(job) {
    const { importJobId, tenantId } = importJobFields(job);

    await processImportJob(tenantId, importJobId);
  },
};

function createImportWorkerHooks(): WorkerHooks {
  return {
    async onStarted(job) {
      const { importJobId, tenantId } = importJobFields(job);

      recordImportJob("processing");
      await updateImportJobWorkerState({
        importJobId,
        ...requestIdField(job),
        retryCount: job.attempts,
        status: "processing",
        tenantId,
      });
    },
    onCompleted() {
      recordImportJob("completed");
    },
    async onFailed(job, error, attempts) {
      const { importJobId, tenantId } = importJobFields(job);

      recordImportJob("failed");
      await updateImportJobWorkerState({
        errorMessage: error instanceof Error ? error.message : "Unknown import worker error",
        importJobId,
        ...requestIdField(job),
        retryCount: attempts,
        status: "failed",
        tenantId,
      });
    },
    async onDeadLetter(job, error, attempts) {
      const { importJobId, tenantId } = importJobFields(job);

      recordImportJob("dead_letter");
      await updateImportJobWorkerState({
        errorMessage: error instanceof Error ? error.message : "Unknown import worker error",
        importJobId,
        ...requestIdField(job),
        retryCount: attempts,
        status: "dead_letter",
        tenantId,
      });
    },
  };
}

export async function runImportWorkerOnce(): Promise<Awaited<ReturnType<typeof runNextWorkerJob>>> {
  return runNextWorkerJob(
    {
      processors: [importWorkerProcessor],
      queueName: importQueueName,
    },
    createImportWorkerHooks(),
  );
}
