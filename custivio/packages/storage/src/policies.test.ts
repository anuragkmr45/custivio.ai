import { describe, expect, it } from "vitest";

import {
  assertAllowedContentType,
  calculateSha256Hex,
  createContentDisposition,
  createSafeDownloadFilename,
} from "./policies";

describe("storage policies", () => {
  it("sanitizes unsafe download filenames", () => {
    expect(createSafeDownloadFilename("../unsafe invoice?.pdf")).toBe(".._unsafe_invoice_.pdf");
    expect(createContentDisposition("report final.csv")).toBe(
      'attachment; filename="report_final.csv"',
    );
  });

  it("rejects unsupported MIME types", () => {
    expect(() => assertAllowedContentType("text/plain")).not.toThrow();
    expect(() => assertAllowedContentType("application/x-msdownload")).toThrow(
      "Unsupported content type",
    );
  });

  it("calculates SHA-256 checksums for stored objects", () => {
    expect(calculateSha256Hex(new TextEncoder().encode("invoice"))).toBe(
      "52d6e3de4fa0dcc29946695f93940c3e7f26f30e1e39f4b1a49ad98839112786",
    );
  });
});
