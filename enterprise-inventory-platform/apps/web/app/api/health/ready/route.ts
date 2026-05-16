import { getReadinessHttpStatus, getReadinessStatus } from "@enterprise-inventory/core";
import { createRequestId } from "@enterprise-inventory/telemetry";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const readiness = await getReadinessStatus();

  return NextResponse.json(
    {
      ...readiness,
      requestId,
    },
    {
      status: getReadinessHttpStatus(readiness),
      headers: {
        "x-request-id": requestId,
      },
    },
  );
}
