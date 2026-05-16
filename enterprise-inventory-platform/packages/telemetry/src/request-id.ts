import { randomUUID } from "node:crypto";

export function createRequestId(existingRequestId?: string | null): string {
  return existingRequestId && existingRequestId.trim().length > 0
    ? existingRequestId
    : randomUUID();
}
