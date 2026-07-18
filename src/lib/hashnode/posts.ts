import type { BlogPost, BlogPostDetail } from "@/types/blogPost";
import { fetchHashnodeRss, parseHashnodeRss, extractText, type HashnodeResult } from "./rss";
import { generateShortId } from "@/lib/shortId";

/**
 * Maximum number of RSS items fetched when resolving short-links or article
 * pages. All consumers must use this constant so the coverage window stays
 * in sync across the app.
 */
export const RSS_FEED_MAX_SIZE = 200;

const PUBLICATION_HOST = process.env.HASHNODE_PUBLICATION_HOST;

/** True once a real Hashnode publication is configured. */
export function isHashnodeConfigured(): boolean {
  return Boolean(PUBLICATION_HOST);
}

/** Derive a slug from a Hashnode post URL (e.g. .../my-post → "my-post"). */
function slugFromLink(link: string): string {
  const trimmed = link.replace(/\/$/, "");
  const parts = trimmed.split("/");
  return parts.at(-1) || trimmed;
}

/**
 * Produce a URL-safe, collision-free slug from a tag name.
 * Preserves distinctive punctuation (`C#` → `csharp`, `C++` → `cplusplus`)
 * so adjacent technical tags remain unique.
 */
function makeTagSlug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("#", "sharp")
    .replaceAll("++", "plusplus")
    .replaceAll("+", "plus")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replaceAll(/--+/g, "-");
}

/** Rough reading-time estimate from HTML text (GraphQL gave this directly;
 *  RSS doesn't, so we approximate at ~200 wpm as a fallback). */
function estimateReadTime(html: string): number {
  // Replace HTML tags with spaces to get plain text. Excluding `<` from the
  // tag body prevents quadratic backtracking on malformed `<`-heavy input.
  const text = html.replace(/<[^><]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function mapSummary(item: ReturnType<typeof parseHashnodeRss>[number]): BlogPost {
  const link = extractText(item.link);
  const slug = slugFromLink(link);
  const categories = item.category;
  let categoryList: string[];
  if (Array.isArray(categories)) {
    categoryList = categories;
  } else if (categories) {
    categoryList = [categories];
  } else {
    categoryList = [];
  }
  const tags = categoryList
    .map((c) => extractText(c).trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: makeTagSlug(name) }));

  const coverImageUrl = item.enclosure?.["@_url"] ?? null;
  const content = extractText(item["content:encoded"]);
  const description = extractText(item.description);

  // Validate pubDate: a malformed date must not produce "Invalid Date", which
  // would later break sorting/parsing elsewhere. Fall back to epoch so items
  // with a bad date sort to the bottom, never become featured, and produce a
  // stable sitemap lastModified across revalidations.
  const parsedDate = item.pubDate ? new Date(item.pubDate) : null;
  const publishedAt =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : "1970-01-01T00:00:00.000Z";

  return {
    slug,
    shortId: generateShortId(slug),
    title: extractText(item.title),
    subtitle: null,
    brief: description,
    coverImageUrl,
    publishedAt,
    readTimeInMinutes: estimateReadTime(content || description),
    url: link,
    tags,
    author: {
      name: extractText(item["dc:creator"]) || "Lawrence Juma",
      username: "jumalaw98",
      profilePictureUrl: null,
    },
  };
}

function mapFull(item: ReturnType<typeof parseHashnodeRss>[number]): BlogPostDetail {
  const summary = mapSummary(item);
  const content = extractText(item["content:encoded"]);
  return {
    ...summary,
    contentHtml: content,
    ogImageUrl: summary.coverImageUrl,
  };
}

/**
 * Core fetch + parse shared by all post-retrieval functions.
 * Returns raw parsed RSS items (capped at `limit`), or an error result.
 * Uses a single shared revalidation tag so ISR can purge all cached
 * post data on any content change.
 */
async function fetchAndParseRss(
  limit: number,
): Promise<HashnodeResult<ReturnType<typeof parseHashnodeRss>>> {
  if (!PUBLICATION_HOST) {
    return { ok: false, error: "HASHNODE_PUBLICATION_HOST is not set", reason: "not_configured" };
  }

  const result = await fetchHashnodeRss(PUBLICATION_HOST, {
    revalidate: 3600,
    tags: ["hashnode-posts"],
  });

  if (!result.ok) return result;

  try {
    const items = parseHashnodeRss(result.data);
    return { ok: true, data: items.slice(0, limit) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to parse Hashnode RSS feed:", message);
    return { ok: false, error: `Failed to parse RSS feed: ${message}`, reason: "fetch_failed" };
  }
}

/**
 * Summary-only posts (no `contentHtml`) — for the listing page, sitemap,
 * RSS feed, and short-link resolution. Keeps client payload lean by
 * excluding the full article HTML that is only needed on the article page.
 */
export async function getAllPosts(limit = 50): Promise<HashnodeResult<BlogPost[]>> {
  const result = await fetchAndParseRss(limit);
  if (!result.ok) return result;
  return { ok: true, data: result.data.map(mapSummary) };
}

/**
 * Full post details including `contentHtml` — for the article page
 * (`/blog/[slug]`). Use `getAllPosts` instead wherever `contentHtml`
 * is not required.
 */
export async function getAllPostDetails(limit = 50): Promise<HashnodeResult<BlogPostDetail[]>> {
  const result = await fetchAndParseRss(limit);
  if (!result.ok) return result;
  return { ok: true, data: result.data.map(mapFull) };
}

export async function getPostBySlug(slug: string): Promise<HashnodeResult<BlogPostDetail | null>> {
  const result = await fetchAndParseRss(RSS_FEED_MAX_SIZE);
  if (!result.ok) return result;

  try {
    const match = result.data.find((item) => slugFromLink(extractText(item.link)) === slug);
    return { ok: true, data: match ? mapFull(match) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to resolve post by slug "${slug}":`, message);
    return { ok: false, error: `Failed to resolve post: ${message}`, reason: "fetch_failed" };
  }
}

/** All unique tags across fetched posts, for the tag filter UI. */
export function getAllTagsFromPosts(posts: BlogPost[]) {
  const tagMap = new Map<string, { name: string; slug: string }>();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap.has(tag.slug)) tagMap.set(tag.slug, tag);
    }
  }
  return Array.from(tagMap.values());
}

/** Up to `limit` other posts sharing at least one tag with `post`, most-recent first. */
export function getRelatedPosts(post: BlogPost, allPosts: BlogPost[], limit = 3): BlogPost[] {
  const tagSlugs = new Set(post.tags.map((t) => t.slug));

  return allPosts
    .filter((p) => p.slug !== post.slug && p.tags.some((t) => tagSlugs.has(t.slug)))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

/** The posts immediately before/after `post` in publish order, for prev/next navigation. */
export function getAdjacentPosts(post: BlogPost, allPosts: BlogPost[]) {
  const sorted = [...allPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const index = sorted.findIndex((p) => p.slug === post.slug);

  return {
    previous: index > 0 ? sorted[index - 1] : null,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
