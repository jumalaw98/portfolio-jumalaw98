import test from "node:test";
import assert from "node:assert/strict";
import { stripHtmlToText } from "./html.ts";

test("stripHtmlToText removes long tags with attributes without counting attribute tokens as words", () => {
  const html =
    '<p>See this <iframe src="https://example.com/embed?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></iframe> now</p>';

  const text = stripHtmlToText(html);

  assert.equal(text, "See this  now");
  assert.equal(text.trim().split(/\s+/).filter(Boolean).length, 3);
  assert.equal(text.includes("https://example.com"), false);
});
