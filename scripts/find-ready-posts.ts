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
 *   3. `devToId` is absent (not set or falsy)
 *
 * Usage:
 *   tsx scripts/find-ready-posts.ts
 *
 * Output (stdout):
 *   { "publish": [{ "slug": "...", "title": "..." }, ...] }
 *
 * Exit code is always 0 — an empty list is a valid result.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOG_DIR = resolve("src/content/blog");

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
  summary?: { hook?: unknown };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Collect all `.mdx` file paths inside a directory (non-recursive, matching
 * existing script conventions).
 */
function collectMdxFiles(dir: string): string[] {
  const files: string[] = [];
  let entries;

  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(join(dir, entry.name));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
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
    const parsed = yaml.load(frontmatterYaml) as Frontmatter;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run(): void {
  const filePaths = collectMdxFiles(BLOG_DIR);
  const publish: ReadyPost[] = [];

  for (const filePath of filePaths) {
    let content: string;

    try {
      content = readFileSync(filePath, "utf-8");
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

    // Condition 3: devToId must be absent (not set or falsy)
    if (frontmatter.devToId) {
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
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  run();
}
