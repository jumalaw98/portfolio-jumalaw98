import { describe, it, expect } from "vitest";
import { truncateAtWordBoundary } from "./truncate";

describe("truncateAtWordBoundary", () => {
  it("returns the original text when under the limit", () => {
    const text = "Short text";
    expect(truncateAtWordBoundary(text, 100)).toBe(text);
  });

  it("returns the original text when exactly at the limit", () => {
    const text = "Exactly 20 chars";
    expect(truncateAtWordBoundary(text, 16)).toBe(text);
  });

  it("cuts at the last space before the limit and appends …", () => {
    const text = "This is a longer sentence that should be truncated safely.";
    // slice(0, 20) = "This is a longer sen"
    // lastIndexOf(" ") = 16 (after "longer")
    // result = "This is a longer…"  (18 chars + "…" = 19, under 20)
    const result = truncateAtWordBoundary(text, 20);
    expect(result).toBe("This is a longer…");
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("does not cut mid-word", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    // slice(0, 14) = "The quick bro"
    // lastIndexOf(" ") = 9 (after "quick")
    // result = "The quick…"
    const result = truncateAtWordBoundary(text, 14);
    expect(result).toBe("The quick…");
    // The ellipsis replaces the space at the word boundary, no partial word
  });

  it("hard-truncates with ellipsis when a single word exceeds the limit and there is no space", () => {
    const text = "Supercalifragilisticexpialidocious";
    const result = truncateAtWordBoundary(text, 10);
    // No space in the slice, so hard truncate at limit with ellipsis
    expect(result).toBe("Supercali…");
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("result length never exceeds the limit when spaces exist", () => {
    const texts = [
      "A short string",
      "A medium-length string that needs some trimming here",
      "This is a much longer string that absolutely needs to be truncated properly at a word boundary without any issues",
    ];
    for (const text of texts) {
      const result = truncateAtWordBoundary(text, 25);
      expect(result.length).toBeLessThanOrEqual(25);
    }
  });

  it("handles empty string", () => {
    expect(truncateAtWordBoundary("", 10)).toBe("");
  });

  it("handles single-word strings under the limit", () => {
    expect(truncateAtWordBoundary("Hello", 10)).toBe("Hello");
  });
});
