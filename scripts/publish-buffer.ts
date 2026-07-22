/**
 * Generate a summary hook for a portfolio MDX post and post it to LinkedIn
 * and X via Buffer.
 *
 * Usage:
 *   tsx scripts/publish-buffer.ts <slug>
 *
 * Environment variables required:
 *   BUFFER_API_KEY            — Buffer personal API key
 *   BUFFER_LINKEDIN_CHANNEL_ID — Buffer channel ID for LinkedIn
 *   BUFFER_X_CHANNEL_ID       — Buffer channel ID for X/Twitter
 *   NEXT_PUBLIC_SITE_URL      — Portfolio base URL (for canonical link)
 *
 * Behavior:
 *   - Reads the MDX file at src/content/blog/<slug>.mdx
 *   - Runs the summary fallback chain (manual → Gemini → OpenRouter → excerpt)
 *   - Builds platform-specific posts (X with character limit, LinkedIn full)
 *   - Posts to both channels via Buffer's API
 *   - If one channel fails, the other is still attempted
 *   - Exits non-zero only if BOTH channels fail
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import { getSummary } from "@/lib/summary/getSummary";
import { buildXPost, buildLinkedInPost } from "@/lib/social/buildPosts";
import { postToBuffer } from "@/lib/social/buffer";

// ── CLI arg ──────────────────────────────────────────────────────────────────

const SLUG = process.argv[2];
if (!SLUG) {
  console.error("Usage: tsx scripts/publish-buffer.ts <slug>");
  process.exit(1);
}
// Validate slug to prevent path traversal (SonarCloud S5146)
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(SLUG)) {
  console.error(`Invalid slug: "${SLUG}". Slug must be kebab-case (letters, numbers, hyphens).`);
  process.exit(1);
}

// ── Environment ──────────────────────────────────────────────────────────────

const getEnv = (name: string): string => {
  const val = process.env[name]?.trim();
  if (!val) {
    console.error(`${name} is required. Set it in your environment or .env.local.`);
    process.exit(1);
  }
  return val;
};

const BUFFER_API_KEY = getEnv("BUFFER_API_KEY");
const LINKEDIN_CHANNEL_ID = getEnv("BUFFER_LINKEDIN_CHANNEL_ID");
const X_CHANNEL_ID = getEnv("BUFFER_X_CHANNEL_ID");

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jumalaw98.vercel.app";
let SITE_URL = rawSiteUrl;
while (SITE_URL.endsWith("/")) {
  SITE_URL = SITE_URL.slice(0, -1);
}

// ── Read & parse the MDX file ───────────────────────────────────────────────

const filePath = resolve("src/content/blog", `${SLUG}.mdx`);

let content: string;
try {
  content = readFileSync(filePath, "utf-8");
} catch {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const parts = content.split(/^---$/m);
if (parts.length < 3) {
  console.error(`Invalid MDX: missing frontmatter in ${filePath}`);
  process.exit(1);
}

const frontmatterYaml = parts[1].trim();
const bodyMdx = parts.slice(2).join("---").trim();

let frontmatter: Record<string, unknown>;
try {
  frontmatter = yaml.load(frontmatterYaml) as Record<string, unknown>;
} catch (err) {
  console.error("Failed to parse frontmatter YAML:", err);
  process.exit(1);
}

// ── Convert MDX body to plain text for the summary LLM ───────────────────────

function mdxToPlainText(mdx: string): string {
  return (
    mdx
      // Remove JSX component syntax
      .replace(/^import\s.*$/gm, "")
      .replace(/<[A-Z][a-zA-Z]*\s[^>]*>/g, "")
      .replace(/<[A-Z][a-zA-Z]*\s*\/?>/g, "")
      .replace(/<\/[A-Z][a-zA-Z]*>/g, "")
      // Strip frontmatter if any slipped through
      .replace(/^---[\s\S]*?---\n/, "")
      // Remove markdown image references
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Unwrap link syntax: [text](url) → text
      .replace(/\[([^\]]+?)\]\([^\s)]+?\)/g, "$1")
      // Remove code-fence markers but keep content
      .replace(/```\w*/g, "")
      .trim()
  );
}

const plainBody = mdxToPlainText(bodyMdx);
const portfolioUrl = `${SITE_URL}/blog/${SLUG}`;

// ── Run summary fallback chain ───────────────────────────────────────────────

const summaryInput = {
  frontmatter: {
    summary: frontmatter.summary as { hook?: string; body?: string } | undefined,
    excerpt: (frontmatter.excerpt as string) ?? "",
  },
  rawBody: plainBody,
};

console.log(`Generating summary for "${SLUG}"...`);

const summary = await getSummary(summaryInput);

console.log(`  Hook: ${summary.hook}`);
if (summary.body) {
  console.log(`  Body: ${summary.body}`);
}

// ── Build platform posts ─────────────────────────────────────────────────────

const xPost = buildXPost(summary, portfolioUrl);
const linkedInPost = buildLinkedInPost(summary, portfolioUrl);

console.log(`\nX post (${xPost.length} chars):`);
console.log(`  ${xPost}`);
console.log(`\nLinkedIn post:`);
const linkedInLines = linkedInPost.split("\n").length;
console.log(`  ${linkedInLines} lines, ${linkedInPost.length} chars`);

// ── Post to Buffer ───────────────────────────────────────────────────────────

console.log("\n── Posting to Buffer ──");

const linkedInResult = await postToBuffer(linkedInPost, LINKEDIN_CHANNEL_ID, {
  saveToDraft: true,
});

if (linkedInResult.success) {
  console.log(`✅ LinkedIn: draft saved (id: ${linkedInResult.postId ?? "unknown"})`);
} else {
  console.error(`❌ LinkedIn: ${linkedInResult.error}`);
}

const xResult = await postToBuffer(xPost, X_CHANNEL_ID, {
  saveToDraft: true,
});

if (xResult.success) {
  console.log(`✅ X: draft saved (id: ${xResult.postId ?? "unknown"})`);
} else {
  console.error(`❌ X: ${xResult.error}`);
}

// Exit non-zero only if BOTH channels failed
if (!linkedInResult.success && !xResult.success) {
  console.error("\nBoth channels failed — exiting with error.");
  process.exit(1);
}

console.log("\nDone.");
