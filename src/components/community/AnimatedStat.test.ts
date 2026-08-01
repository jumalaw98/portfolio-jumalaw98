import { describe, it, expect } from "vitest";
import { getAnimatedStatAnimate } from "./AnimatedStat";

describe("getAnimatedStatAnimate", () => {
  describe("reduced motion enabled", () => {
    it("returns visible target when in view", () => {
      expect(getAnimatedStatAnimate(true, true)).toEqual({ opacity: 1, y: 0 });
    });

    it("returns visible target when not in view", () => {
      expect(getAnimatedStatAnimate(true, false)).toEqual({ opacity: 1, y: 0 });
    });

    it("returns visible target when inView is undefined", () => {
      expect(getAnimatedStatAnimate(true, undefined)).toEqual({ opacity: 1, y: 0 });
    });
  });

  describe("reduced motion disabled", () => {
    it("returns visible target when in view", () => {
      expect(getAnimatedStatAnimate(false, true)).toEqual({ opacity: 1, y: 0 });
    });

    it("returns undefined when not in view", () => {
      expect(getAnimatedStatAnimate(false, false)).toBeUndefined();
    });

    it("returns undefined when inView is undefined", () => {
      expect(getAnimatedStatAnimate(false, undefined)).toBeUndefined();
    });
  });

  describe("return value shape", () => {
    it("returns an object with opacity and y when visible", () => {
      const result = getAnimatedStatAnimate(false, true);
      expect(result).toHaveProperty("opacity");
      expect(result).toHaveProperty("y");
      expect(result?.opacity).toBe(1);
      expect(result?.y).toBe(0);
    });

    it("returns undefined (not null) when hidden", () => {
      const result = getAnimatedStatAnimate(false, false);
      expect(result).toBeUndefined();
      expect(result).not.toBeNull();
    });
  });
});
