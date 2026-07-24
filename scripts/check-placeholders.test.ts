import { describe, it, expect } from "vitest";
import { checkContent } from "./check-placeholders";

describe("checkContent", () => {
  // ── Positive cases (should match) ──────────────────────────────────────────

  it("catches [TBD]", () => {
    expect(checkContent("Some [TBD] content")).toEqual(["[TBD]"]);
  });

  it("catches [confirm something]", () => {
    expect(checkContent("Please [confirm the date]")).toEqual(["[confirm...]"]);
  });

  it("catches [placeholder: update me]", () => {
    expect(checkContent("Add [placeholder: update me] here")).toEqual(["[placeholder...]"]);
  });

  it("catches lorem ipsum (lowercase)", () => {
    expect(checkContent("lorem ipsum dolor sit amet")).toEqual(["lorem ipsum"]);
  });

  it("catches LOREM IPSUM (uppercase, case-insensitive)", () => {
    expect(checkContent("LOREM IPSUM DOLOR SIT")).toEqual(["lorem ipsum"]);
  });

  it("catches mixed-case Lorem Ipsum", () => {
    expect(checkContent("Lorem Ipsum is dummy text")).toEqual(["lorem ipsum"]);
  });

  // ── Negative cases (should NOT match) ──────────────────────────────────────

  it("does not match 'I am confirming the results' (no brackets)", () => {
    expect(checkContent("I am confirming the results")).toEqual([]);
  });

  it("does not match 'the placeholder variable was set' (no brackets)", () => {
    expect(checkContent("the placeholder variable was set")).toEqual([]);
  });

  it("does not match 'the TBD process' (not in bracket format)", () => {
    expect(checkContent("the TBD process")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(checkContent("")).toEqual([]);
  });

  // ── Multiple patterns in one string ───────────────────────────────────────

  it("catches multiple distinct patterns in the same content", () => {
    const result = checkContent("[TBD] and [confirm this] and lorem ipsum");
    expect(result).toContain("[TBD]");
    expect(result).toContain("[confirm...]");
    expect(result).toContain("lorem ipsum");
    expect(result).toHaveLength(3);
  });
});
