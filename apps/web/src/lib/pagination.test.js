import { describe, expect, it } from "bun:test";
import { getPageWindow } from "./pagination.ts";

describe("getPageWindow", () => {
  it("returns every page when total fits in the window", () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
    expect(getPageWindow(2, 3)).toEqual([1, 2, 3]);
    expect(getPageWindow(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("caps at `max` buttons no matter how many pages exist (the welfare-table regression)", () => {
    expect(getPageWindow(1, 999)).toHaveLength(7);
    expect(getPageWindow(500, 999)).toHaveLength(7);
    expect(getPageWindow(999, 100000)).toHaveLength(7);
  });

  it("anchors to the start near the first pages", () => {
    expect(getPageWindow(1, 999)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPageWindow(4, 999)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("slides around the active page in the middle", () => {
    expect(getPageWindow(50, 999)).toEqual([47, 48, 49, 50, 51, 52, 53]);
  });

  it("anchors to the end near the last pages", () => {
    expect(getPageWindow(999, 999)).toEqual([993, 994, 995, 996, 997, 998, 999]);
  });

  it("honours a custom max", () => {
    expect(getPageWindow(1, 999, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageWindow(50, 999, 5)).toEqual([48, 49, 50, 51, 52]);
  });

  it("never returns a page outside 1..total", () => {
    for (const active of [1, 2, 8, 25, 26]) {
      const win = getPageWindow(active, 26);
      expect(Math.min(...win)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...win)).toBeLessThanOrEqual(26);
    }
  });
});
