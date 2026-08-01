import { describe, it, expect } from "vitest";
import { getTimelineNodeAnimate, getTimelineNodeInitial } from "./TimelineNode";

// ---------------------------------------------------------------------------
// getTimelineNodeInitial
// ---------------------------------------------------------------------------
describe("getTimelineNodeInitial", () => {
  describe("reduced motion enabled", () => {
    it("returns undefined so the server renders the node visible (no opacity:0 flash)", () => {
      expect(getTimelineNodeInitial(true)).toBeUndefined();
    });

    it("never hides the node for reduced-motion users (opacity must not be 0)", () => {
      const initial = getTimelineNodeInitial(true);
      // undefined means Framer Motion skips the initial state entirely →
      // the element is visible from the first paint.  If this ever returns
      // an object with opacity:0 the PR regression has been reintroduced.
      if (initial !== undefined) {
        expect((initial as { opacity: number }).opacity).not.toBe(0);
      }
    });
  });

  describe("reduced motion disabled (normal motion)", () => {
    it("returns a hidden initial state so the entrance animation plays", () => {
      expect(getTimelineNodeInitial(false)).toEqual({ scale: 0, opacity: 0 });
    });

    it("sets opacity to 0 so the element is invisible before entering the viewport", () => {
      const initial = getTimelineNodeInitial(false);
      expect(initial).not.toBeUndefined();
      expect((initial as { opacity: number }).opacity).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// getTimelineNodeAnimate
// ---------------------------------------------------------------------------
describe("getTimelineNodeAnimate", () => {
  describe("reduced motion enabled", () => {
    it("returns a visible animate target so the node is always shown", () => {
      expect(getTimelineNodeAnimate(true)).toEqual({ scale: 1, opacity: 1 });
    });

    it("guarantees opacity:1 so reduced-motion users always see the element", () => {
      const animate = getTimelineNodeAnimate(true);
      // This is the core contract the original PR enforced: opacity must be
      // explicitly 1, not 0 or absent, so a runtime preference-change is safe.
      expect(animate).not.toBeUndefined();
      expect((animate as { opacity: number }).opacity).toBe(1);
    });
  });

  describe("reduced motion disabled (normal motion)", () => {
    it("returns undefined, deferring visibility to whileInView", () => {
      expect(getTimelineNodeAnimate(false)).toBeUndefined();
    });
  });

  describe("prop contract invariant", () => {
    it("initial opacity:0 + animate opacity:1 means reduced-motion users are never stuck invisible", () => {
      // When shouldReduceMotion=true:
      //   initial → undefined (visible from paint)
      //   animate → { opacity: 1 } (explicit target)
      // When shouldReduceMotion=false:
      //   initial → { opacity: 0 } (hidden until in-view)
      //   animate → undefined (whileInView drives visibility)
      // Verify the combination is never { initial: opacity:0, animate: undefined }
      // for a reduced-motion user — that would hide the element forever.
      const reducedInitial = getTimelineNodeInitial(true);
      const reducedAnimate = getTimelineNodeAnimate(true);

      const wouldBeStuckInvisible =
        reducedInitial !== undefined &&
        (reducedInitial as { opacity: number }).opacity === 0 &&
        reducedAnimate === undefined;

      expect(wouldBeStuckInvisible).toBe(false);
    });
  });
});
