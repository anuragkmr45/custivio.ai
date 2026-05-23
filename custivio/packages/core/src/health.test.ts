import { describe, expect, it } from "vitest";

import { getReadinessHttpStatus, type ReadinessStatus } from "./health";

describe("getReadinessHttpStatus", () => {
  it("returns 200 when ready", () => {
    const readiness: ReadinessStatus = {
      status: "ready",
      checkedAt: new Date().toISOString(),
      dependencies: [],
    };

    expect(getReadinessHttpStatus(readiness)).toBe(200);
  });

  it("returns 503 when not ready", () => {
    const readiness: ReadinessStatus = {
      status: "not_ready",
      checkedAt: new Date().toISOString(),
      dependencies: [],
    };

    expect(getReadinessHttpStatus(readiness)).toBe(503);
  });
});
