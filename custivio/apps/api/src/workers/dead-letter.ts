import { logger } from "@custivio/telemetry";

import type { WorkerRunResult } from "./job-runner";

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

export function logDeadLetterResult(result: WorkerRunResult): void {
  if (result.status !== "dead_letter") {
    return;
  }

  logger.error("Worker dead-letter result recorded", {
    ...resultLogFields(result),
    errorCode: "worker_dead_letter",
    context: {
      attempts: result.attempts,
      errorMessage: result.errorMessage,
      jobId: result.job?.id,
      type: result.job?.type,
    },
  });
}
