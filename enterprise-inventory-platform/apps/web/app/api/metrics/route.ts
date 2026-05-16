import { renderMetrics, getMetricsContentType } from "@enterprise-inventory/telemetry";

export const runtime = "nodejs";

export async function GET() {
  return new Response(await renderMetrics(), {
    status: 200,
    headers: {
      "content-type": getMetricsContentType(),
    },
  });
}
