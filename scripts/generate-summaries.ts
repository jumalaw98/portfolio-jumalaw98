/**
 * Generate AI summaries for published MDX blog posts that lack a summary hook.
 *
 * Usage:
 *   npx tsx scripts/generate-summaries.ts
 *
 * Environment variables required (if using AI fallback):
 *   GEMINI_API_KEY       — for Gemini summary generation
 *   OPENROUTER_API_KEY   — for OpenRouter summary generation
 *
 * Behavior:
 *   - Scans all .mdx files under src/content/blog/
 *   - For each published post without a frontmatter summary.hook:
 *       - Extracts body text, strips MDX/JSX syntax
 *       - Calls getSummary() (fallback chain: manual → Gemini → OpenRouter → excerpt)
 *       - Writes the summary back into the frontmatter
 *   - Prints modified file paths to stdout (one per line) for CI detection
 *   - Progress messages go to stderr so CI can read stdout cleanly
 *   - Exits 0 (success) or 1 (error)
 *
 * TRUST BOUNDARY / HARDENING (why every fs call is path-checked):
 *   This script reads each post body and sends it to third-party AI APIs, then
 *   writes the result back onto disk. It therefore must never touch a path
 *   outside the content tree:
 *     - BLOG_DIR is derived from this file's location, not the working directory
 *     - the directory walk never follows symlinks and only returns regular files
 *       (src/lib/safe-path.ts)
 *     - the real (symlink-resolved) path is re-validated before each read and
 *       write, and a violation aborts the run rather than continuing
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { parseFrontmatterObject } from "@/lib/frontmatter";
import { getSummary } from "@/lib/summary/getSummary";
import { mdxToPlainText } from "../src/lib/mdx/strip-jsx";
import { assertRealPathWithinBase, listFilesWithinBase } from "@/lib/safe-path";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** Repository root (the parent of `scripts/`), used to validate the blog root. */
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

/**
 * Blog content root, resolved from this script's own location so the scan and
 * the writes are always confined to the repository's content tree, regardless
 * of the current working directory.
 */
const BLOG_DIR = resolve(SCRIPT_DIR, "..", "src", "content", "blog");

/** Glob for authored posts, evaluated relative to BLOG_DIR. */
const MDX_PATTERN = "**/*.mdx";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Every `.mdx` file inside BLOG_DIR, sorted for stable output.
 *
 * The blog root is validated against the repository tree before the walk:
 * `realpath(BLOG_DIR)` is the walk's containment boundary, so a symlinked
 * `src/content/blog` would otherwise become its own trusted boundary and this
 * script would read and rewrite `.mdx` files in the link target. Throwing
 * here — outside any catch — aborts the run (fail closed), as documented in
 * the TRUST BOUNDARY note in the header.
 *
 * Symlinks are also excluded from the results: a symlinked file committed
 * under src/content/blog/ could otherwise be read (leaking its contents to
 * the AI providers) and then overwritten.
 */
function findMdxFiles(): string[] {
  const blogRoot = assertRealPathWithinBase(REPO_ROOT, BLOG_DIR);
  return listFilesWithinBase({ baseDir: blogRoot, pattern: MDX_PATTERN, extension: ".mdx" });
}

// ── Per-file processing ───────────────────────────────────────────────────────

/**
 * Process a single MDX file: read, parse, generate summary if missing, and write
 * back. Returns the file path if modified, or null if skipped.
 */
async function processFile(filePath: string): Promise<string | null> {
  // Containment (symlink-aware) before any I/O. Throwing here is intentional —
  // a path that escapes the content tree means the workspace is not trusted, so
  // the run stops instead of touching it.
  const safePath = assertRealPathWithinBase(BLOG_DIR, filePath);

  let content;
  try {
    content = readFileSync(safePath, "utf-8");
  } catch (err) {
    console.error(`Failed to read ${safePath}:`, err);
    return null;
  }

  const parts = content.split(/^---$/m);
  if (parts.length < 3) {
    return null;
  }

  const frontmatterYaml = parts[1].trim();
  const bodyMdx = parts.slice(2).join("---").trim();

  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = parseFrontmatterObject(frontmatterYaml);
  } catch {
    return null;
  }

  if (frontmatter.published !== true) {
    return null;
  }

  const existingSummary = frontmatter.summary as { hook?: string; body?: string } | undefined;

  if (existingSummary?.hook) {
    return null;
  }

  const excerpt = (frontmatter.excerpt as string) ?? "";
  const plainBody = mdxToPlainText(bodyMdx);

  console.error(`Generating summary for "${filePath}"...`);

  const summary = await getSummary({
    frontmatter: { summary: existingSummary, excerpt },
    rawBody: plainBody,
  });

  const newSummary: Record<string, string> = { hook: summary.hook };
  if (summary.body) {
    newSummary.body = summary.body;
  }
  frontmatter.summary = newSummary;

  const updatedFrontmatterYaml = yaml.dump(frontmatter, {
    sortKeys: false,
    lineWidth: Infinity,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  } as yaml.DumpOptions);

  const updatedContent = `---\n${updatedFrontmatterYaml.trimEnd()}\n---\n\n${bodyMdx}\n`;

  // Re-assert containment immediately before the write — deliberately outside
  // the try below: a containment violation must abort the run (see the TRUST
  // BOUNDARY note in the header), not be swallowed as an ordinary write error
  // and let the run continue.
  const writePath = assertRealPathWithinBase(BLOG_DIR, safePath);
  try {
    writeFileSync(writePath, updatedContent, "utf-8");
  } catch (err) {
    console.error(`Failed to write ${safePath}:`, err);
    return null;
  }

  console.error(`  ✅ Summary written to ${safePath}`);
  return safePath;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const filePaths = findMdxFiles();

  if (filePaths.length === 0) {
    console.error("No MDX files found in", BLOG_DIR);
    return;
  }

  const modifiedFiles: string[] = [];

  for (const filePath of filePaths) {
    const result = await processFile(filePath);
    if (result) {
      modifiedFiles.push(result);
    }
  }

  // ── Output modified paths to stdout for CI detection ──────────────────────
  for (const fp of modifiedFiles) {
    console.log(fp);
  }

  if (modifiedFiles.length === 0) {
    console.error("No files needed summaries.");
  }

  console.error("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
