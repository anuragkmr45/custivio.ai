import { describe, expect, it } from "vitest";
import { clampPage, formatPaginationRange, getPageCount, paginate } from "./pagination";

describe("pagination helpers", () => {
  it("calculates page counts with an empty list floor", () => {
    expect(getPageCount(0, 10)).toBe(1);
    expect(getPageCount(1, 10)).toBe(1);
    expect(getPageCount(21, 10)).toBe(3);
  });

  it("clamps invalid or out-of-range pages", () => {
    expect(clampPage(-2, 25, 10)).toBe(0);
    expect(clampPage(99, 25, 10)).toBe(2);
    expect(clampPage(Number.NaN, 25, 10)).toBe(0);
  });

  it("returns rows for the requested page", () => {
    expect(paginate([1, 2, 3, 4, 5], 1, 2)).toEqual([3, 4]);
    expect(paginate([1, 2, 3, 4, 5], 4, 2)).toEqual([5]);
  });

  it("formats the visible row range", () => {
    expect(formatPaginationRange(0, 0, 10)).toBe("0 records");
    expect(formatPaginationRange(25, 0, 10)).toBe("1-10 of 25");
    expect(formatPaginationRange(25, 2, 10)).toBe("21-25 of 25");
  });
});
