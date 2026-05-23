import { findExportJobById } from "@custivio/db";
import { getObject } from "@custivio/storage";
import { recordExportJob } from "@custivio/telemetry";

import { runNextWorkerJob, type WorkerHooks, type WorkerProcessor } from "./job-runner";

import type { QueueJob } from "@custivio/cache";

export const exportQueueName = "exports";
export const exportVerifyJobType = "export.verify";

function readRequiredPayloadString(job: QueueJob, key: string): string {
  const value = job.payload[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required for ${job.type}.`);
  }

  return value;
}

export const exportWorkerProcessor: WorkerProcessor = {
  type: exportVerifyJobType,
  async process(job) {
    const tenantId = job.tenantId ?? readRequiredPayloadString(job, "tenantId");
    const exportJobId = readRequiredPayloadString(job, "exportJobId");
    const exportJob = await findExportJobById(tenantId, exportJobId);

    if (!exportJob) {
      throw new Error("Export job was not found.");
    }

    await getObject(exportJob.objectKey);
  },
};

export async function runExportWorkerOnce(): Promise<Awaited<ReturnType<typeof runNextWorkerJob>>> {
  const hooks: WorkerHooks = {
    onStarted() {
      recordExportJob("processing");
    },
    onCompleted() {
      recordExportJob("completed");
    },
    onFailed() {
      recordExportJob("failed");
    },
    onDeadLetter() {
      recordExportJob("dead_letter");
    },
  };

  return runNextWorkerJob(
    {
      processors: [exportWorkerProcessor],
      queueName: exportQueueName,
    },
    hooks,
  );
}
