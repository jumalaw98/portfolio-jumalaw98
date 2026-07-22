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
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import yaml from "js-yaml";
import { getSummary } from "@/lib/summary/getSummary";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOG_DIR = resolve("src/content/blog");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strip MDX/JSX syntax down to plain text suitable for the summary LLM.
 * This mirrors the approach in scripts/publish-buffer.ts.
 */
function mdxToPlainText(mdx: string): string {
  return (
    mdx
      // Remove JSX import statements
      .replace(/^import\s+[^\r\n]*from\s+['"][^'"]+['"];?\s*$/gm, "")
      // Remove opening JSX component tags with attributes
      .replace(/<[A-Z][a-zA-Z]*\s[^>]*>/g, "")
      // Remove self-closing JSX component tags
      .replace(/<[A-Z][a-zA-Z]*\s*\/?>/g, "")
      // Remove closing JSX component tags
      .replace(/<\/[A-Z][a-zA-Z]*>/g, "")
      // Strip any stray frontmatter
      .replace(/^---[\s\S]*?---\n/, "")
      // Remove markdown image references
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Unwrap link syntax: [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove code-fence markers but keep content
      .replace(/```\w*/g, "")
      .trim()
  );
}

/**
 * Scan a directory for .mdx files.
 */
function findMdxFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(join(dir, entry.name));
    }
  }

  return files.sort();
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const filePaths = findMdxFiles(BLOG_DIR);

  if (filePaths.length === 0) {
    console.error("No MDX files found in", BLOG_DIR);
    return;
  }

  const modifiedFiles: string[] = [];

  for (const filePath of filePaths) {
    let content: string;

    try {
      content = readFileSync(filePath, "utf-8");
    } catch (err) {
      console.error(`Failed to read ${filePath}:`, err);
      continue;
    }

    // Split on frontmatter delimiters
    const parts = content.split(/^---$/m);
    if (parts.length < 3) {
      // No frontmatter at all — skip silently (not a valid post)
      continue;
    }

    const frontmatterYaml = parts[1].trim();
    const bodyMdx = parts.slice(2).join("---").trim();

    let frontmatter: Record<string, unknown>;
    try {
      frontmatter = yaml.load(frontmatterYaml) as Record<string, unknown>;
    } catch {
      // Unparseable YAML — skip
      continue;
    }

    if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
      continue;
    }

    // Only process published posts
    if (frontmatter.published !== true) {
      continue;
    }

    // Check whether a summary hook already exists
    const existingSummary = frontmatter.summary as
      | { hook?: string; body?: string }
      | undefined;

    if (existingSummary?.hook) {
      continue; // Already has a manual hook — nothing to generate
    }

    // ── Generate summary ────────────────────────────────────────────────────
    const excerpt = (frontmatter.excerpt as string) ?? "";
    const plainBody = mdxToPlainText(bodyMdx);

    console.error(`Generating summary for "${filePath}"...`);

    const summary = await getSummary({
      frontmatter: { summary: existingSummary, excerpt },
      rawBody: plainBody,
    });

    // ── Update frontmatter ──────────────────────────────────────────────────
    const newSummary: Record<string, string> = { hook: summary.hook };
    if (summary.body) {
      newSummary.body = summary.body;
    }
    frontmatter.summary = newSummary;

    // Serialize back to YAML, preserving key order and disabling line wrapping
    // so the frontmatter stays compact and predictable.
    // Note: js-yaml@5 supports quotingType / forceQuotes, but the installed
    // @types/js-yaml@4 types do not — we cast to bypass the strict check
    // since the runtime package (v5) accepts these options.
    const updatedFrontmatterYaml = yaml.dump(frontmatter, {
      sortKeys: false,
      lineWidth: Infinity,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    } as yaml.DumpOptions);

    // Reconstruct the full file content and write it back.
    // The trailing newline ensures the file ends cleanly.
    const updatedContent =
      `---\n${updatedFrontmatterYaml.trimRight()}\n---\n\n${bodyMdx}\n`;

    try {
      writeFileSync(filePath, updatedContent, "utf-8");
    } catch (err) {
      console.error(`Failed to write ${filePath}:`, err);
      continue;
    }

    modifiedFiles.push(filePath);
    console.error(`  ✅ Summary written to ${filePath}`);
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
