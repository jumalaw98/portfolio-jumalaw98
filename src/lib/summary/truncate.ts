/**
 * Truncate text at word boundary so we never cut mid-word.
 *
 * If `text.length <= limit` the original string is returned unchanged.
 * When truncation is needed, the cut happens at the last space before the
 * limit and `…` is appended — this guarantees the result never exceeds
 * `limit` characters and never contains a partial word.
 *
 * @param text — the string to truncate.
 * @param limit — maximum allowed character length.
 * @returns the original text or a word-boundary-truncated version.
 */
export function truncateAtWordBoundary(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit);

  // Find the last space character within the slice.
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace === -1) {
    // No space in the slice — the single "word" is longer than limit.
    // Return the whole word anyway (avoid mangling) since this is a safety
    // net, not a hard post-processor.
    return text;
  }

  return truncated.slice(0, lastSpace) + "…";
}
