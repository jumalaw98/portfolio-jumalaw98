import { describe, it, expect } from "vitest";
import { getProjectCardAnimate } from "./ProjectCard";

describe("getProjectCardAnimate", () => {
  it("returns animate target when reduced motion is enabled for offscreen card", () => {
    expect(getProjectCardAnimate(true)).toEqual({ opacity: 1, y: 0 });
  });

  it("returns undefined when reduced motion is disabled", () => {
    expect(getProjectCardAnimate(false)).toBeUndefined();
  });
});
