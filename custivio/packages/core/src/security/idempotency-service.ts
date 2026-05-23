import { createHash } from "node:crypto";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`);

  return `{${entries.join(",")}}`;
}

function readMetadataRecord(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

export function createIdempotencyFingerprint(input: Record<string, unknown>): string {
  return createHash("sha256").update(stableSerialize(input)).digest("hex");
}

export function readIdempotencyFingerprint(metadata: unknown): string | undefined {
  const record = readMetadataRecord(metadata);
  const idempotency = record.idempotency;

  if (!idempotency || typeof idempotency !== "object" || Array.isArray(idempotency)) {
    return undefined;
  }

  const requestHash = (idempotency as Record<string, unknown>).requestHash;

  return typeof requestHash === "string" ? requestHash : undefined;
}

export function withIdempotencyFingerprint(
  metadata: Record<string, unknown>,
  requestHash: string,
): Record<string, unknown> {
  return {
    ...metadata,
    idempotency: {
      requestHash,
    },
  };
}
