import { describe, expect, it } from "vitest";
import { seededShuffle } from "@/lib/seeded-shuffle";

describe("seededShuffle", () => {
  it("orders items by independent draws and remains deterministic", () => {
    const items = ["a", "b", "c", "d"];

    expect(seededShuffle(items, "stable-test")).toEqual(["b", "c", "a", "d"]);
    expect(seededShuffle(items, "stable-test")).toEqual(["b", "c", "a", "d"]);
    // Non-BMP seed: the int32 accumulation in mulberry32 wraps to a different
    // draw sequence than an ASCII seed, so the ordering is its own (stable) value.
    expect(seededShuffle(items, "😀")).toEqual(["b", "a", "d", "c"]);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });
});
