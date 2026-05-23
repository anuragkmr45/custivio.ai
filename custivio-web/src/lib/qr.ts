import QRCode from "qrcode";

export type AssetQrPrintInfo = {
  payload: string;
  assetTag: string;
  name: string;
  serialNumber: string;
  location: string;
};

export async function createQrDataUrl(payload: string, size = 192): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
  });
}

export function resolveAssetQrPayload(payload: string | null | undefined, assetId: string): string {
  const trimmed = payload?.trim();

  return trimmed || JSON.stringify({ type: "custivio.asset", version: 1, assetId });
}

export function buildAssetQrPrintHtml(info: AssetQrPrintInfo, qrDataUrl: string): string {
  return `
    <html>
      <head>
        <title>Custivio Asset QR</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            color: #111827;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .label {
            width: 320px;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 16px;
          }
          .brand {
            margin-bottom: 12px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          img {
            display: block;
            width: 192px;
            height: 192px;
            margin: 0 auto 14px;
          }
          h1 {
            margin: 0;
            font-size: 20px;
            line-height: 1.2;
          }
          dl {
            display: grid;
            grid-template-columns: 78px 1fr;
            gap: 6px 10px;
            margin: 14px 0 0;
            font-size: 12px;
          }
          dt {
            color: #6b7280;
          }
          dd {
            margin: 0;
            overflow-wrap: anywhere;
            font-weight: 600;
          }
          @media print {
            body { padding: 0; }
            .label { border-color: #000; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <section class="label">
          <div class="brand">Custivio Asset</div>
          <img src="${escapeHtml(qrDataUrl)}" alt="Asset QR code" />
          <h1>${escapeHtml(info.assetTag)}</h1>
          <dl>
            <dt>Name</dt>
            <dd>${escapeHtml(info.name)}</dd>
            <dt>Serial</dt>
            <dd>${escapeHtml(info.serialNumber)}</dd>
            <dt>Location</dt>
            <dd>${escapeHtml(info.location)}</dd>
          </dl>
        </section>
      </body>
    </html>
  `;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
