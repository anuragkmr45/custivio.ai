import { createRequestId } from "@enterprise-inventory/telemetry";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));

  return NextResponse.json(
    {
      status: "ok",
      service: "enterprise-inventory-platform",
      checkedAt: new Date().toISOString(),
      requestId,
    },
    {
      status: 200,
      headers: {
        "x-request-id": requestId,
      },
    },
  );
}
