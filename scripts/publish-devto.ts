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
import yaml from "js-yaml";
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

/** Publish or update an article on dev.to. Uses fetch internally — tests can mock global fetch. */
export async function publishToDevto(input: PublishInput): Promise<PublishResult> {
  const { title, bodyMarkdown, tags, description, canonicalUrl, devToId, apiKey } = input;

  const validatedDevToId = devToId && Number.isFinite(devToId) ? devToId : undefined;
  const url = validatedDevToId
    ? `https://dev.to/api/articles/${validatedDevToId}` // NOSONAR
    : "https://dev.to/api/articles";
  const method = devToId ? "PUT" : "POST";

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
  return { id: result.id, url: result.url, isUpdate: !!devToId };
}

// ── CLI entry point ─────────────────────────────────────────────────────────
// Only runs when this file is executed directly (not when imported by tests)

const __filename = fileURLToPath(import.meta.url);
const isEntryPoint = process.argv[1] === __filename;

if (isEntryPoint) {
  // ── CLI arg ──────────────────────────────────────────────────────────────────

  const SLUG = process.argv[2];
  if (!SLUG) {
    console.error("Usage: tsx scripts/publish-devto.ts <slug>");
    process.exit(1);
  }
  // Validate slug to prevent path traversal (SonarCloud S5146)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(SLUG)) {
    console.error(`Invalid slug: "${SLUG}". Must be kebab-case.`);
    process.exit(1);
  }

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

  // ── Read & parse the MDX file ───────────────────────────────────────────────

  const filePath = resolve("src/content/blog", `${SLUG}.mdx`); // NOSONAR:typescript:S5146 — slug validated above

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8"); // NOSONAR:typescript:S5146 — path validated above
  } catch {
    console.error(`File not found: ${filePath}`);
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
    frontmatter = yaml.load(frontmatterYaml) as Record<string, unknown>;
  } catch (err) {
    console.error("Failed to parse frontmatter YAML:", err);
    process.exit(1);
  }

  // ── Extract fields ───────────────────────────────────────────────────────────

  const title = frontmatter.title as string;
  const devToIdRaw = frontmatter.devToId as number | undefined;
  const tagsRaw = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];
  const description = (frontmatter.excerpt as string) ?? "";

  if (!title) {
    console.error("Missing required frontmatter field: title");
    process.exit(1);
  }

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
      console.log(
        devToIdRaw ? "Updating existing dev.to article..." : "Creating new dev.to article...",
      );

      const result = await publishToDevto({
        title,
        bodyMarkdown,
        tags,
        description,
        canonicalUrl,
        devToId: devToIdRaw,
        apiKey: API_KEY,
      });

      console.log(`\n✅ Published to dev.to: ${result.url}`);

      // If this was a new article, persist the devToId into frontmatter.
      if (!result.isUpdate) {
        const frontmatterLines = frontmatterYaml.split("\n");
        const devToIdIndex = frontmatterLines.findIndex((l) => l.startsWith("devToId:"));

        if (devToIdIndex >= 0) {
          frontmatterLines[devToIdIndex] = `devToId: ${result.id}`;
        } else {
          frontmatterLines.push(`devToId: ${result.id}`);
        }

        const updatedFrontmatter = frontmatterLines.join("\n");
        const updatedContent = content.replace(
          /^---\n[\s\S]*?\n---\n/m,
          `---\n${updatedFrontmatter}\n---\n`,
        );

        if (updatedContent === content) {
          console.error(
            "Failed to replace frontmatter in the file content. Frontmatter delimiter pattern did not match.",
          );
          process.exit(1);
        }

        writeFileSync(filePath, updatedContent, "utf-8"); // NOSONAR:typescript:S5146 — path validated above
        console.log("✏️  devToId written to frontmatter");
      }
    } catch {
      console.error("Publish failed.");
      process.exit(1);
    }
  }

  await publish();
}
