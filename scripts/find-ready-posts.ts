#!/usr/bin/env tsx
/**
 * find-ready-posts.ts
 *
 * Scans portfolio MDX posts and prints JSON to stdout listing which ones
 * are ready for publishing to dev.to.
 *
 * A post is considered "ready for publishing" when:
 *   1. `published: true`
 *   2. `summary.hook` is present (truthy)
 *   3. `bufferPostedAt` is absent — social posting has not yet completed successfully
 *
 * Usage:
 *   tsx scripts/find-ready-posts.ts
 *
 * Output (stdout):
 *   { "publish": [{ "slug": "...", "title": "..." }, ...] }
 *
 * Exit code is always 0 — an empty list is a valid result.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatterObject } from "@/lib/frontmatter";
import { assertRealPathWithinBase, listFilesWithinBase } from "@/lib/safe-path";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** Repository root (the parent of `scripts/`), used to validate the blog root. */
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

/**
 * Blog content root, derived from this file's location so the scan is always
 * confined to the repository's content tree (never the current directory).
 */
const BLOG_DIR = resolve(SCRIPT_DIR, "..", "src", "content", "blog");

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ReadyPost {
  slug: string;
  title: string;
}

interface Frontmatter {
  title?: string;
  slug?: string;
  published?: boolean;
  devToId?: unknown;
  bufferPostedAt?: unknown;
  summary?: { hook?: unknown };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Collect every `.mdx` file under BLOG_DIR.
 *
 * Uses the shared hardened walk (src/lib/safe-path.ts): symlinked directories
 * are not followed and symlinked files are skipped, so a committed symlink
 * cannot pull files from outside the content tree into the publish pipeline.
 *
 * The blog root itself is validated against the repository tree first:
 * `realpath(BLOG_DIR)` is the walk's containment boundary, so a symlinked
 * `src/content/blog` would otherwise become its own trusted boundary. Any
 * failure here (missing directory, root outside the repo) yields an empty
 * list — the documented contract of this command: it always prints JSON and
 * exits 0, and reading nothing from an untrusted tree is fail-closed.
 */
function collectMdxFiles(): string[] {
  try {
    const blogRoot = assertRealPathWithinBase(REPO_ROOT, BLOG_DIR);
    return listFilesWithinBase({ baseDir: blogRoot, pattern: "**/*.mdx", extension: ".mdx" });
  } catch {
    return [];
  }
}

/**
 * Parse YAML frontmatter from an MDX file's raw content.
 * Returns the parsed frontmatter object, or `null` if parsing fails.
 */
function parseFrontmatter(content: string): Frontmatter | null {
  const parts = content.split(/^---$/m);

  // parts[0] = content before first --- (usually empty or whitespace)
  // parts[1] = YAML frontmatter
  // parts[2..] = body (may contain --- in code blocks)
  if (parts.length < 3) {
    return null;
  }

  const frontmatterYaml = parts[1].trim();

  try {
    return parseFrontmatterObject(frontmatterYaml) as Frontmatter;
  } catch {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run(): void {
  const filePaths = collectMdxFiles();
  const publish: ReadyPost[] = [];

  for (const filePath of filePaths) {
    let content: string;

    try {
      // Re-verify the real path before reading (fail closed for scripts: if a
      // path escaped the content tree, this throws instead of leaking the file).
      content = readFileSync(assertRealPathWithinBase(BLOG_DIR, filePath), "utf-8");
    } catch {
      // Skip unreadable files
      continue;
    }

    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      continue;
    }

    // Condition 1: published must be exactly true
    if (frontmatter.published !== true) {
      continue;
    }

    // Condition 2: summary.hook must be present and truthy
    const hook = frontmatter.summary?.hook;
    if (!hook) {
      continue;
    }

    // Condition 3: post must not have completed social posting.
    // bufferPostedAt is written by publish-buffer.ts only after BOTH channels
    // succeed. A post that has devToId but no bufferPostedAt still needs Buffer
    // to run — dev.to will receive a harmless PUT update on retry.
    if (frontmatter.bufferPostedAt) {
      continue;
    }

    // Collect slug and title — skip if either is missing
    const slug = frontmatter.slug;
    const title = frontmatter.title;
    if (!slug || !title) {
      continue;
    }

    publish.push({ slug, title });
  }

  // Always print JSON to stdout; exit 0 (empty list is valid)
  process.stdout.write(JSON.stringify({ publish }) + "\n");
}

// ── CLI Entry Point ───────────────────────────────────────────────────────────
// Only run when this file is executed directly (not when imported by tests)

const isMainModule =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  run();
}
