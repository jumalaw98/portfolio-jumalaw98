/**
 * CLI argument parsing for the content/publishing scripts.
 *
 * The slug is the only user-supplied value that reaches a filesystem path
 * (`resolve(BLOG_DIR, ${slug}.mdx)`), so it is validated **before** any path is
 * built. Two independent gates apply:
 *
 *   1. `isValidSlug()` — a closed character set, no path separators, no dots,
 *      no leading dash, and a length bound matching the content schema, so
 *      `../`, absolute paths and hidden files are impossible by construction;
 *   2. `assertRealPathWithinBase()` in src/lib/safe-path.ts — the symlink-aware
 *      containment check performed immediately before the I/O.
 *
 * Character checks are done per segment instead of with a backtracking-heavy
 * regular expression; the pattern is a single anchored character class, so it
 * cannot exhibit catastrophic backtracking.
 */

/**
 * Longest accepted slug.
 *
 * Mirrors the bound the content schema already enforces — `s.slug("posts")` in
 * velite.config.ts is `min(3).max(200)` — so publishing can never reject a post
 * the content pipeline accepts. This is a sanity bound on the filename handed
 * to the filesystem and to the public URL, **not** a path-traversal control:
 * that comes from the closed character set plus `assertRealPathWithinBase()`.
 */
export const SLUG_MAX_LENGTH = 200;

/** One kebab-case segment: lowercase letters and digits only. */
const SLUG_SEGMENT_PATTERN = /^[a-z0-9]+$/;

/**
 * Validate a post slug.
 *
 * Rejects, among others: `../secret`, `../../etc/passwd`, `/etc/passwd`,
 * `a/b`, `..`, `.env`, `A-Post`, `-leading`, `trailing-`, and the empty string.
 *
 * @param value - Candidate slug
 * @returns `true` when the value is safe to use as a content filename stem
 */
export function isValidSlug(value: string): boolean {
  if (value.length === 0 || value.length > SLUG_MAX_LENGTH) return false;
  if (value.startsWith("-") || value.endsWith("-")) return false;

  const segments = value.split("-");
  for (const segment of segments) {
    if (!SLUG_SEGMENT_PATTERN.test(segment)) return false;
  }
  return true;
}

export interface SlugArg {
  readonly slug: string;
}

export interface SlugArgError {
  readonly reason: string;
  readonly usage: string;
}

/**
 * Human-readable usage line for a script.
 *
 * The script name is interpolated (rather than written as one literal) so the
 * same helper can serve every entry point without duplicating the message.
 *
 * @param script - Path shown to the operator, e.g. `scripts/publish-devto.ts`
 * @returns One-line usage hint
 */
export function usageFor(script: string): string {
  return `Usage: tsx ${script} <slug>`;
}

/**
 * Extract and validate the slug argument.
 *
 * @param argv - `process.argv` (`argv[2]` is the slug)
 * @param script - Script path used in the usage message
 * @returns The slug, or a reason + usage line explaining the rejection
 */
export function parseSlugArg(argv: readonly string[], script: string): SlugArg | SlugArgError {
  const usage = usageFor(script);
  const raw = argv[2];

  if (raw === undefined || raw === "") {
    return { reason: `Missing required argument: slug.`, usage };
  }

  if (!isValidSlug(raw)) {
    return {
      reason: `Invalid slug: ${JSON.stringify(raw)}. Must be kebab-case (lowercase letters, digits, hyphens) and at most ${SLUG_MAX_LENGTH} characters.`,
      usage,
    };
  }

  return { slug: raw };
}

/** Narrowing helper: distinguishes a parsed slug from a rejection. */
export function isSlugArgError(result: SlugArg | SlugArgError): result is SlugArgError {
  return "reason" in result;
}
