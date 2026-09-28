import type { BlogPost, BlogPostDetail, BlogAuthor } from "@/types/blogPost";
import { generateShortId } from "@/lib/shortId";
import { EMPTY_SANITIZED_HTML } from "@/lib/html-sanitize";
import { asCompiledMdxCode } from "@/lib/mdx/compiled-mdx";
import type { CompiledMdxCode } from "@/lib/mdx/compiled-mdx";

// ── Author constant ──────────────────────────────────────────────────────────
const AUTHOR: BlogAuthor = {
  name: "Lawrence Juma",
  username: "jumalaw98",
  profilePictureUrl: "https://ik.imagekit.io/lawz/law/jumalaw98.jpg",
};

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Convert a tag name string to the { name, slug } shape both page components expect. */
function toTag(name: string): { name: string; slug: string } {
  return {
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  };
}

/** Shape of a raw Velite post as returned from the compiled output. */
interface VeliteRaw {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  coverImage?: { src: string } | null;
  readTimeInMinutes: number;
  published: boolean;
  body: string;
  metadata?: {
    wordCount: number;
  };
}

/** Type for the Velite-generated index module. */
interface VeliteModule {
  posts: VeliteRaw[];
}

/**
 * Load the Velite-generated posts array.  Retries up to 5 times with 200ms
 * delays to handle the race window where next.config.ts fires `velite.build()`
 * asynchronously (fire-and-forget) and the .velite/ directory may not be fully
 * written when first page code executes.
 */
async function loadPosts(): Promise<VeliteRaw[]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { existsSync, readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      const velitePath = join(process.cwd(), ".velite/posts.json");
      if (existsSync(velitePath)) {
        const content = readFileSync(velitePath, "utf-8");
        const posts = JSON.parse(content);
        if (Array.isArray(posts)) {
          const mod = (await import("#velite")) as VeliteModule;
          return mod.posts ?? posts;
        }
      }
    } catch {
      // Not ready yet — wait and retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  // After all retries, return empty rather than crashing
  return [];
}

// ── Listing page helpers ─────────────────────────────────────────────────

/** Helper to map a raw Velite post to the complete PortfolioPostDetail. */
function toPortfolioDetail(p: VeliteRaw): PortfolioPostDetail {
  // Compiled MDX is validated before it is branded: only Velite output for a
  // real content file reaches the evaluator in MdxContent. See
  // src/lib/mdx/compiled-mdx.ts.
  const mdxBody = asCompiledMdxCode(p.body);
  if (mdxBody === null) {
    throw new Error(
      `Velite post "${p.slug}" has no evaluable compiled MDX body — refusing to render it.`,
    );
  }

  return {
    source: "portfolio",
    slug: p.slug,
    shortId: generateShortId(p.slug),
    title: p.title,
    subtitle: null,
    brief: p.excerpt,
    coverImageUrl: p.coverImage?.src ?? null,
    publishedAt: p.date,
    readTimeInMinutes: p.readTimeInMinutes ?? 3,
    url: `/blog/${p.slug}`,
    tags: p.tags.map(toTag),
    author: AUTHOR,
    ogImageUrl: p.coverImage?.src ?? null,
    // MDX posts have no HTML payload; the field is required by BlogPostDetail,
    // so use the canonical sanitized empty value rather than a raw string.
    contentHtml: EMPTY_SANITIZED_HTML,
    mdxBody,
  };
}

/**
 * Velite MDX posts mapped to a BlogPost-shaped object, with a `source`
 * discriminator.  Published-only, newest-first.
 */
export async function getPortfolioPosts(): Promise<(BlogPost & { source: "portfolio" })[]> {
  const raw = await loadPosts();
  return raw
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(toPortfolioDetail);
}

// ── Article page helpers ─────────────────────────────────────────────────

/**
 * Extended detail for a portfolio (Velite MDX) post on the article page.
 * Carries the compiled MDX body instead of pre-rendered HTML.
 * Extends BlogPostDetail so it can be used interchangeably with Hashnode
 * posts in adjacent/related helpers.
 */
export interface PortfolioPostDetail extends BlogPostDetail {
  source: "portfolio";
  /** Velite-compiled MDX, validated and branded by `asCompiledMdxCode`. */
  mdxBody: CompiledMdxCode;
}

/** Look up a single Velite post by slug for the article page. */
export async function getPortfolioPostBySlug(slug: string): Promise<PortfolioPostDetail | null> {
  const raw = await loadPosts();
  const found = raw.find((p) => p.slug === slug && p.published);
  if (!found) return null;

  return toPortfolioDetail(found);
}

/** All published Velite posts as PortfolioPostDetail, newest-first. */
export async function getAllPortfolioDetails(): Promise<PortfolioPostDetail[]> {
  return (await getPortfolioPosts()) as PortfolioPostDetail[];
}
