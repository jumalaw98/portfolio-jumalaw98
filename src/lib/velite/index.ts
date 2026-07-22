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
 * Load the Velite-generated posts array.  The .velite/ directory is guaranteed
 * to exist by the time any page code runs because next.config.ts evaluates
 * `velite.build()` during config evaluation, before page compilation starts.
 */
async function loadPosts(): Promise<VeliteRaw[]> {
  try {
    const mod = (await import("#velite")) as VeliteModule;
    return mod.posts ?? [];
  } catch {
    // During first build / cold start the import might transiently fail if
    // Velite hasn't finished writing its output yet.  Return empty rather
    // than crashing — the next request will succeed.
    return [];
  }
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
