import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const scriptPath = join(projectRoot, "scripts", "check-forbidden-deps.mjs");

describe("forbidden dependency scanner", () => {
  it("passes the current scaffold", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    expect(output).toContain("Forbidden dependency check passed.");
  });
});
