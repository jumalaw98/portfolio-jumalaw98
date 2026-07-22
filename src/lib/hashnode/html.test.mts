import { describe, it, expect } from "vitest";
import { stripHtmlToText } from "./html.js";

describe("stripHtmlToText", () => {
  it("removes long tags with attributes without counting attribute tokens as words", () => {
    const html =
      '<p>See this <iframe src="https://example.com/embed?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></iframe> now</p>';

    const text = stripHtmlToText(html);

    // Spacing might be multiple spaces due to space-separated tag transitions
    expect(text.trim().replaceAll(/\s+/g, " ")).toBe("See this now");
    expect(text.trim().split(/\s+/).filter(Boolean)).toHaveLength(3);

    const containsExampleHost = text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .some((token) => {
        try {
          return new URL(token).hostname === "example.com";
        } catch {
          return false;
        }
      });
    expect(containsExampleHost).toBe(false);
  });

  it("separates adjacent tags with spaces to preserve word boundaries", () => {
    const html = "<li>Item</li><li>Other</li>";
    const text = stripHtmlToText(html);

    expect(text.trim().replaceAll(/\s+/g, " ")).toBe("Item Other");
    const words = text.trim().split(/\s+/).filter(Boolean);
    expect(words).toEqual(["Item", "Other"]);
  });

  it("decodes HTML entities into text equivalents", () => {
    const html =
      "See &amp; believe &lt; &gt; &quot;yes&quot; &#39;no&#39; &apos;maybe&apos; &nbsp; &#123; &#x7B;";
    const text = stripHtmlToText(html);

    expect(text).toBe("See & believe < > \"yes\" 'no' 'maybe'   { {");
  });
});
