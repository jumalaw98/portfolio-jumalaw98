import type { BlogPost, BlogPostDetail, BlogAuthor } from "@/types/blogPost";
import { generateShortId } from "@/lib/shortId";

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
      const mod = (await import("#velite")) as VeliteModule;
      if (mod.posts?.length) return mod.posts;
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
    contentHtml: "",
    mdxBody: p.body,
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
  mdxBody: string;
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
