/**
 * Build platform-specific post text for X and LinkedIn.
 *
 * Both functions accept a summary object and the target portfolio URL, then
 * construct a body that respects each platform's character conventions.
 */

import { truncateAtWordBoundary } from "@/lib/summary/truncate";
import { X_TEXT_BUDGET } from "@/lib/summary/constants";

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
 * visible before "see more" truncation.  No truncation is applied here —
 * the `LINKEDIN_HOOK_TARGET` constant is used by the summary generator but
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
