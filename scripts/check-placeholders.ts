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

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

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
 * Recursively collect all `.mdx` file paths under a directory.
 */
function collectMdxFiles(dir: string): string[] {
  const files: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    // Directory doesn't exist or can't be read — return empty list
    return files;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(fullPath));
    } else if (entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── CLI entry point ──────────────────────────────────────────────────────────

function run(): void {
  const blogDir = resolve("src/content/blog");
  const mdxFiles = collectMdxFiles(blogDir);

  const violations: Array<{ file: string; patterns: string[] }> = [];

  for (const file of mdxFiles) {
    const content = readFileSync(file, "utf-8");
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
const isMainModule = process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  run();
}
