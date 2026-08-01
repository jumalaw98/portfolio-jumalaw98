import { describe, it, expect } from "vitest";
import { getTimelineNodeAnimate } from "./TimelineNode";

describe("getTimelineNodeAnimate", () => {
  describe("reduced motion enabled", () => {
    it("returns animate target with scale: 1 and opacity: 1", () => {
      expect(getTimelineNodeAnimate(true)).toEqual({ scale: 1, opacity: 1 });
    });
  });

  describe("reduced motion disabled", () => {
    it("returns undefined so framer-motion falls through to whileInView", () => {
      expect(getTimelineNodeAnimate(false)).toBeUndefined();
    });
  });
});
