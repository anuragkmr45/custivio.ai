import { describe, expect, it } from "vitest";
import { buildAssetQrPrintHtml, escapeHtml, resolveAssetQrPayload } from "@/lib/qr";

describe("asset QR helpers", () => {
  it("uses backend QR payload when available and falls back to a Custivio asset payload", () => {
    expect(resolveAssetQrPayload(" backend-payload ", "asset-1")).toBe("backend-payload");
    expect(JSON.parse(resolveAssetQrPayload("", "asset-1"))).toMatchObject({
      type: "custivio.asset",
      version: 1,
      assetId: "asset-1",
    });
  });

  it("builds a print label with escaped readable asset fields", () => {
    const html = buildAssetQrPrintHtml(
      {
        payload: "payload",
        assetTag: "TAG-<1>",
        name: "Server & Laptop",
        serialNumber: "SER-001",
        location: "BLR / MDF",
      },
      "data:image/png;base64,abc",
    );

    expect(html).toContain("Custivio Asset");
    expect(html).toContain("TAG-&lt;1&gt;");
    expect(html).toContain("Server &amp; Laptop");
    expect(html).toContain("data:image/png;base64,abc");
  });

  it("escapes HTML-sensitive characters", () => {
    expect(escapeHtml(`"'&<>`)).toBe("&quot;&#039;&amp;&lt;&gt;");
  });
});
