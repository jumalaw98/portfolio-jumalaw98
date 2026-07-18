/**
 * Generate a deterministic, URL-safe short ID from a blog post slug.
 * Uses DJB2 hash → base36 → first 6 chars.
 * Same slug always produces the same shortId — no storage needed.
 */
export function generateShortId(slug: string): string {
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
