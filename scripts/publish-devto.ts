/**
 * Publish a portfolio MDX post to dev.to.
 *
 * Usage:
 *   tsx scripts/publish-devto.ts <slug>
 *
 * Environment variables required:
 *   DEVTO_API_KEY — dev.to API key (from https://dev.to/settings/extensions)
 *
 * Behavior:
 *   - Reads the MDX file at src/content/blog/<slug>.mdx
 *   - If frontmatter has no devToId → POST (create) and writes the new ID back
 *   - If frontmatter has devToId → PUT (update) the existing article
 *   - Always sends canonical_url pointing back to the portfolio
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isSlugArgError, parseSlugArg } from "@/lib/cli-args";
import { parseFrontmatterObject, upsertFrontmatterField } from "@/lib/frontmatter";
import { assertRealPathWithinBase } from "@/lib/safe-path";
import { mdxToMarkdown } from "../src/lib/mdx/strip-jsx";

// ── Interfaces & core publish function ──────────────────────────────────────

interface DevToArticle {
  id: number;
  url: string;
}

export interface PublishInput {
  title: string;
  bodyMarkdown: string;
  tags: string[];
  description: string;
  canonicalUrl: string;
  devToId?: number;
  apiKey: string;
}

export interface PublishResult {
  id: number;
  url: string;
  isUpdate: boolean;
}

const TRAILING_PATH_SEPARATOR = "/";

function normalizeCanonicalUrl(url: string): string {
  const trimmedUrl = url.trim();
  let endIndex = trimmedUrl.length;

  while (endIndex > 0 && trimmedUrl.charAt(endIndex - 1) === TRAILING_PATH_SEPARATOR) {
    endIndex -= 1;
  }

  return trimmedUrl.slice(0, endIndex).toLowerCase();
}

/** Helper to search existing user articles on dev.to by canonical URL to ensure idempotent publishing. */
async function findArticleByCanonicalUrl(
  canonicalUrl: string,
  apiKey: string,
): Promise<number | undefined> {
  const response = await fetch("https://dev.to/api/articles/me/all?per_page=1000", {
    headers: {
      "api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`dev.to idempotency lookup failed (${response.status}): ${errorBody}`);
  }

  const articles = (await response.json()) as unknown;
  if (!Array.isArray(articles)) {
    throw new TypeError("dev.to idempotency lookup returned an unexpected response shape.");
  }

  const targetUrl = normalizeCanonicalUrl(canonicalUrl);
  const match = articles.find((art) => {
    if (
      typeof art !== "object" ||
      art === null ||
      !("canonical_url" in art) ||
      !("id" in art) ||
      typeof art.canonical_url !== "string" ||
      typeof art.id !== "number"
    ) {
      return false;
    }
    const artUrl = normalizeCanonicalUrl(art.canonical_url);
    return artUrl === targetUrl;
  });

  return match?.id;
}

/** Publish or update an article on dev.to. Uses fetch internally — tests can mock global fetch. */
export async function publishToDevto(input: PublishInput): Promise<PublishResult> {
  const { title, bodyMarkdown, tags, description, canonicalUrl, devToId, apiKey } = input;

  let validatedDevToId = devToId && Number.isFinite(devToId) ? devToId : undefined;

  // If devToId was not provided, check dev.to for an existing article matching canonicalUrl
  if (!validatedDevToId) {
    validatedDevToId = await findArticleByCanonicalUrl(canonicalUrl, apiKey);
  }

  const url = validatedDevToId
    ? `https://dev.to/api/articles/${validatedDevToId}` // NOSONAR
    : "https://dev.to/api/articles";
  const method = validatedDevToId ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      article: {
        title,
        body_markdown: bodyMarkdown,
        published: true,
        canonical_url: canonicalUrl,
        tags,
        description: description || undefined,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`dev.to API error (${response.status}): ${errorBody}`);
  }

  const result = (await response.json()) as DevToArticle;
  return { id: result.id, url: result.url, isUpdate: !!validatedDevToId };
}

// ── CLI entry point ─────────────────────────────────────────────────────────
// Only runs when this file is executed directly (not when imported by tests)

const __filename = fileURLToPath(import.meta.url);
const isEntryPoint = process.argv[1] === __filename;

if (isEntryPoint) {
  // ── CLI arg ──────────────────────────────────────────────────────────────────
  // Shared parser (src/lib/cli-args.ts): validates the slug before it reaches
  // any path construction, and prints the standard usage line on rejection.

  const slugArg = parseSlugArg(process.argv, "scripts/publish-devto.ts");
  if (isSlugArgError(slugArg)) {
    console.error(slugArg.reason);
    console.error(slugArg.usage);
    process.exit(1);
  }
  const SLUG = slugArg.slug;

  // ── Environment ──────────────────────────────────────────────────────────────

  const API_KEY: string = process.env.DEVTO_API_KEY?.trim() ?? "";
  if (!API_KEY) {
    console.error("DEVTO_API_KEY is required. Set it in your environment or .env.local file.");
    process.exit(1);
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jumalaw98.vercel.app";
  let SITE_URL = rawSiteUrl;
  while (SITE_URL.endsWith("/")) {
    SITE_URL = SITE_URL.slice(0, -1);
  }

  // ── Blog content root, validated against the repository tree ────────────────
  //
  // Derived from this file's location — never `process.cwd()` — and validated
  // with the shared hardening (src/lib/safe-path.ts): a symlinked
  // src/content/blog (or a symlinked <slug>.mdx inside it) would otherwise be
  // read (leaking the target's contents to dev.to) and then overwritten. A
  // containment violation aborts the run (fail closed).
  const BLOG_DIR = resolve(__filename, "..", "..", "src", "content", "blog");
  const REPO_ROOT = resolve(__filename, "..", "..");

  let blogRoot: string;
  try {
    blogRoot = assertRealPathWithinBase(REPO_ROOT, BLOG_DIR);
  } catch (err) {
    console.error(
      "Blog content root is missing or outside the repository:",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }

  // ── Read & parse the MDX file ───────────────────────────────────────────────

  const mdxPath = resolve(BLOG_DIR, `${SLUG}.mdx`);

  let content: string;
  let filePath: string;
  try {
    // Symlink-aware containment before any I/O: a symlinked <slug>.mdx that
    // points outside the content tree is rejected instead of being read.
    filePath = assertRealPathWithinBase(blogRoot, mdxPath);
    content = readFileSync(filePath, "utf-8"); // NOSONAR:typescript:S5146 — path validated by assertRealPathWithinBase
  } catch {
    console.error(`File not found (or outside the content tree): ${mdxPath}`);
    process.exit(1);
  }

  const parts = content.split(/^---$/m);
  // parts[0] = content before first --- (usually empty or whitespace)
  // parts[1] = YAML frontmatter
  // parts[2..] = body (may contain --- in code blocks)
  if (parts.length < 3) {
    console.error(`Invalid MDX: missing frontmatter in ${filePath}`);
    process.exit(1);
  }

  const frontmatterYaml = parts[1].trim();
  const bodyMdx = parts.slice(2).join("---").trim();

  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = parseFrontmatterObject(frontmatterYaml);
  } catch (err) {
    console.error("Failed to parse frontmatter YAML:", err);
    process.exit(1);
  }

  // ── Extract fields ───────────────────────────────────────────────────────────

  if (typeof frontmatter.title !== "string" || !frontmatter.title) {
    console.error("Missing required frontmatter field: title");
    process.exit(1);
  }
  const title: string = frontmatter.title;
  const devToIdRaw = frontmatter.devToId as number | undefined;
  const tagsRaw = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];
  const description = (frontmatter.excerpt as string) ?? "";

  // ── Convert MDX body to plain markdown ───────────────────────────────────────
  // Strips JSX-style MDX component syntax (imports, custom component tags)
  // while preserving standard markdown (headings, lists, code blocks, links).

  const bodyMarkdown = mdxToMarkdown(bodyMdx);
  const canonicalUrl = `${SITE_URL}/blog/${SLUG}`;

  // Validate character budgets
  if (bodyMarkdown.length < 1) {
    console.error("Article body is empty after MDX→markdown conversion.");
    process.exit(1);
  }

  // dev.to allows max 4 tags
  const tags = tagsRaw.slice(0, 4);

  // ── CLI wrapper ─────────────────────────────────────────────────────────────

  async function publish(): Promise<void> {
    try {
      const result = await publishToDevto({
        title,
        bodyMarkdown,
        tags,
        description,
        canonicalUrl,
        devToId: devToIdRaw,
        apiKey: API_KEY,
      });

      console.log(
        result.isUpdate ? "Updated existing dev.to article." : "Created new dev.to article.",
      );
      console.log(`\n✅ Published to dev.to: ${result.url}`);

      // If devToId was not originally present in frontmatter, persist devToId into frontmatter.
      // The shared updater (src/lib/frontmatter.ts) rewrites the field in place,
      // leaving the body and every other line untouched — and returns null when
      // nothing was written, so the run aborts instead of reporting success for
      // a file that never changed.
      if (!devToIdRaw) {
        const updatedContent = upsertFrontmatterField(content, "devToId", result.id);

        if (updatedContent === null) {
          console.error(
            "Failed to update frontmatter in the file content. Either the frontmatter block is missing, or the rewrite produced identical content (devToId already holds this exact value).",
          );
          process.exit(1);
        }

        // Re-assert containment immediately before the write (TOCTOU re-check):
        // a violation here means the file was swapped after the read — the
        // surrounding catch exits(1), so it aborts the run instead of
        // continuing with an unvalidated path.
        writeFileSync(assertRealPathWithinBase(blogRoot, filePath), updatedContent, "utf-8"); // NOSONAR:typescript:S5146 — path validated by assertRealPathWithinBase
        console.log("✏️  devToId written to frontmatter");
      }
    } catch (err) {
      console.error("Publish failed:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }

  await publish();
}
