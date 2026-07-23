/**
 * Build platform-specific post text for X and LinkedIn.
 *
 * Both functions accept a summary object and the target portfolio URL, then
 * construct a body that respects each platform's character conventions.
 */

import { truncateAtWordBoundary } from "@/lib/summary/truncate";
import { X_TEXT_BUDGET } from "@/lib/summary/constants";

/**
 * Count characters using X/Twitter's weighted character counting rules.
 *
 * Most characters count as 1, but CJK characters (CJK Unified Ideographs,
 * Hangul Syllables, etc.) count as 2. This affects the visible length of
 * a post and may cause truncation that `truncateAtWordBoundary` doesn't
 * account for since it counts UTF-16 code units.
 *
 * @see https://developer.twitter.com/en/docs/counting-characters
 */
export function countXCharacters(text: string): number {
  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    // CJK Unified Ideographs (4E00–9FFF), CJK Unified Ideographs Extension A (3400–4DBF),
    // CJK Unified Ideographs Extension B (20000–2A6DF), Kangxi Radicals (2F00–2FDF),
    // Hangul Syllables (AC00–D7AF), and other wide characters
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x20000 && code <= 0x2a6df) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x2f00 && code <= 0x2fdf) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0x3000 && code <= 0x303f)
    ) {
      count += 2;
    } else {
      count += 1;
    }
  }
  return count;
}

interface Summary {
  hook: string;
  body: string | null;
}

/**
 * Build an X (Twitter) post.
 *
 * Format: `{truncated_hook} {url}`
 *
 * The hook is truncated to `X_TEXT_BUDGET` characters before the URL is
 * appended, ensuring the final post fits within X's 280-character limit
 * (including the 23-character t.co link).
 */
export function buildXPost(summary: Summary, url: string): string {
  const hook = truncateAtWordBoundary(summary.hook, X_TEXT_BUDGET);
  return `${hook} ${url}`;
}

/**
 * Build a LinkedIn post.
 *
 * Format:
 *   {hook}
 *   (blank line)
 *   {body}  (if present)
 *   (blank line)
 *   {url}
 *
 * LinkedIn has no hard character limit, but the first ~210 characters are
 * visible before "see more" truncation. No truncation is applied here —
 * this builder lets the full text through.
 */
export function buildLinkedInPost(summary: Summary, url: string): string {
  const parts: string[] = [summary.hook];

  if (summary.body) {
    parts.push("", summary.body);
  }

  parts.push("", url);

  return parts.join("\n");
}
