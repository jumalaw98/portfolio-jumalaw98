import { describe, it, expect } from "vitest";
import { getTimelineNodeAnimate } from "./TimelineNode";

describe("getTimelineNodeAnimate", () => {
  describe("reduced motion enabled", () => {
    it("returns animate target with scale and opacity", () => {
      expect(getTimelineNodeAnimate(true)).toEqual({ scale: 1, opacity: 1 });
    });
  });

  describe("reduced motion disabled", () => {
    it("returns undefined", () => {
      expect(getTimelineNodeAnimate(false)).toBeUndefined();
    });
  });

  describe("return value shape", () => {
    it("returns an object with scale and opacity when reduced motion is enabled", () => {
      const result = getTimelineNodeAnimate(true);
      expect(result).toHaveProperty("scale");
      expect(result).toHaveProperty("opacity");
      expect(result?.scale).toBe(1);
      expect(result?.opacity).toBe(1);
    });

    it("returns undefined (not null) when reduced motion is disabled", () => {
      const result = getTimelineNodeAnimate(false);
      expect(result).toBeUndefined();
      expect(result).not.toBeNull();
    });
  });
});
