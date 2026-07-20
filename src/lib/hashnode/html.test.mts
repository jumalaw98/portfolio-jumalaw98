import test from "node:test";
import assert from "node:assert/strict";
import { stripHtmlToText } from "./html.ts";

test("stripHtmlToText removes long tags with attributes without counting attribute tokens as words", () => {
  const html =
    '<p>See this <iframe src="https://example.com/embed?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></iframe> now</p>';

  const text = stripHtmlToText(html);

  // Spacing might be multiple spaces due to space-separated tag transitions
  assert.equal(text.trim().replaceAll(/\s+/g, " "), "See this now");
  assert.equal(text.trim().split(/\s+/).filter(Boolean).length, 3);
  assert.equal(text.includes("https://example.com"), false);
});

test("stripHtmlToText separates adjacent tags with spaces to preserve word boundaries", () => {
  const html = "<li>Item</li><li>Other</li>";
  const text = stripHtmlToText(html);

  assert.equal(text.trim().replaceAll(/\s+/g, " "), "Item Other");
  const words = text.trim().split(/\s+/).filter(Boolean);
  assert.deepEqual(words, ["Item", "Other"]);
});

test("stripHtmlToText decodes HTML entities into text equivalents", () => {
  const html =
    "See &amp; believe &lt; &gt; &quot;yes&quot; &#39;no&#39; &apos;maybe&apos; &nbsp; &#123; &#x7B;";
  const text = stripHtmlToText(html);

  assert.equal(text, "See & believe < > \"yes\" 'no' 'maybe'   { {");
});
