import { createHash } from "node:crypto";

const allowedMimeTypes = new Set([
  "application/json",
  "application/pdf",
  "application/octet-stream",
  "image/jpeg",
  "image/png",
  "text/csv",
  "text/plain",
]);

export const maxUploadBytes = 10 * 1024 * 1024;

export function assertAllowedContentType(contentType: string): void {
  if (!allowedMimeTypes.has(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
}

export function createSafeDownloadFilename(filename: string): string {
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 180);

  return safe.length > 0 ? safe : "download";
}

export function createContentDisposition(filename: string): string {
  return `attachment; filename="${createSafeDownloadFilename(filename)}"`;
}

export function calculateSha256Hex(body: Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}
