#!/usr/bin/env tsx
/**
 * check-placeholders.ts
 *
 * Scans every .mdx file under src/content/blog/ and reports any
 * placeholder/violation patterns found in the frontmatter or body.
 *
 * Usage:
 *   tsx scripts/check-placeholders.ts
 *
 * Exits with code 0 if no violations, 1 otherwise.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertRealPathWithinBase, listFilesWithinBase } from "@/lib/safe-path";

// ── Constants ────────────────────────────────────────────────────────────────

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** Repository root (the parent of `scripts/`), used to validate the blog root. */
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

/**
 * Blog content root, derived from this file's location so the scan is always
 * confined to the repository's content tree (never the current directory).
 */
const BLOG_DIR = resolve(SCRIPT_DIR, "..", "src", "content", "blog");

// ── Pattern definitions ──────────────────────────────────────────────────────

export interface PatternDef {
  name: string;
  regex: RegExp;
}

export const PATTERNS: PatternDef[] = [
  { name: "[TBD]", regex: /\[TBD\]/ },
  { name: "[confirm...]", regex: /\[confirm[^\]]*\]/i },
  { name: "[placeholder...]", regex: /\[placeholder[^\]]*\]/i },
  { name: "lorem ipsum", regex: /lorem ipsum/i },
];

// ── Public API (exported for unit testing) ───────────────────────────────────

/**
 * Check a string against all placeholder patterns.
 *
 * @param content - The string to scan (e.g., full file contents).
 * @returns A list of human-readable pattern names that matched.
 */
export function checkContent(content: string): string[] {
  return PATTERNS.filter((p) => p.regex.test(content)).map((p) => p.name);
}

// ── File helpers (internal) ─────────────────────────────────────────────────

/**
 * Every `.mdx` file inside BLOG_DIR.
 *
 * Uses the shared hardened walk (src/lib/safe-path.ts): symlinked directories
 * are not followed and symlinked files are skipped, so a committed symlink
 * cannot make this CI gate read files from outside the content tree.
 *
 * The blog root itself is validated against the repository tree first:
 * `realpath(BLOG_DIR)` is the walk's containment boundary, so a symlinked
 * `src/content/blog` would otherwise become its own trusted boundary. Throwing
 * here aborts the run (fail closed).
 */
function collectMdxFiles(): string[] {
  const blogRoot = assertRealPathWithinBase(REPO_ROOT, BLOG_DIR);
  return listFilesWithinBase({ baseDir: blogRoot, pattern: "**/*.mdx", extension: ".mdx" });
}

// ── CLI entry point ──────────────────────────────────────────────────────────

function run(): void {
  const mdxFiles = collectMdxFiles();

  const violations: Array<{ file: string; patterns: string[] }> = [];

  for (const file of mdxFiles) {
    // Defence in depth: re-verify the real path before reading (fail closed).
    const content = readFileSync(assertRealPathWithinBase(BLOG_DIR, file), "utf-8");
    const matched = checkContent(content);
    if (matched.length > 0) {
      violations.push({ file, patterns: matched });
    }
  }

  if (violations.length > 0) {
    console.error("Placeholder violations found:");
    for (const v of violations) {
      console.error(`  ${v.file}: ${v.patterns.join(", ")}`);
    }
    process.exit(1);
  }

  console.log("No placeholder violations found.");
  process.exit(0);
}

// Only run as CLI when this file is the entry point (not when imported for tests)
const isMainModule =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  run();
}
