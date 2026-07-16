import type { BlogPost, BlogPostDetail } from "@/types/blogPost";
import { fetchHashnodeRss, parseHashnodeRss, extractText, type HashnodeResult } from "./rss";

const PUBLICATION_HOST = process.env.HASHNODE_PUBLICATION_HOST;

/** True once a real Hashnode publication is configured. */
export function isHashnodeConfigured(): boolean {
  return Boolean(PUBLICATION_HOST);
}

/** Derive a slug from a Hashnode post URL (e.g. .../my-post → "my-post"). */
function slugFromLink(link: string): string {
  const trimmed = link.replace(/\/$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] || trimmed;
}

/** Rough reading-time estimate from HTML text (GraphQL gave this directly;
 *  RSS doesn't, so we approximate at ~200 wpm as a fallback). */
function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function mapSummary(item: ReturnType<typeof parseHashnodeRss>[number]): BlogPost {
  const link = extractText(item.link);
  const slug = slugFromLink(link);
  const categories = item.category;
  const tags = (Array.isArray(categories) ? categories : categories ? [categories] : [])
    .map((c) => extractText(c).trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }));

  const coverImageUrl = item.enclosure?.["@_url"] ?? null;
  const content = extractText(item["content:encoded"]);
  const description = extractText(item.description);

  // Validate pubDate: a malformed date must not produce "Invalid Date", which
  // would later break sorting/parsing elsewhere. Fall back only when missing
  // or unparseable.
  const parsedDate = item.pubDate ? new Date(item.pubDate) : null;
  const publishedAt =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : new Date().toISOString();

  return {
    slug,
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
 * Fetches posts for the listing page from the publication's RSS feed.
 * RSS returns the most recent N posts in one response (Hashnode caps the feed
 * at a sane limit), so we slice to `limit` rather than paginating cursor-style.
 * This replaces the old GraphQL `posts(first:, after:)` pagination loop.
 */
export async function getAllPosts(limit = 50): Promise<HashnodeResult<BlogPost[]>> {
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
    const posts = items.slice(0, limit).map(mapSummary);
    return { ok: true, data: posts };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to parse Hashnode RSS feed:", message);
    return { ok: false, error: `Failed to parse RSS feed: ${message}`, reason: "fetch_failed" };
  }
}

export async function getPostBySlug(slug: string): Promise<HashnodeResult<BlogPostDetail | null>> {
  if (!PUBLICATION_HOST) {
    return { ok: false, error: "HASHNODE_PUBLICATION_HOST is not set", reason: "not_configured" };
  }

  const result = await fetchHashnodeRss(PUBLICATION_HOST, {
    revalidate: 3600,
    tags: [`hashnode-post-${slug}`],
  });

  if (!result.ok) return result;

  try {
    const items = parseHashnodeRss(result.data);
    const match = items.find((item) => slugFromLink(extractText(item.link)) === slug);
    return { ok: true, data: match ? mapFull(match) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse Hashnode RSS feed for slug "${slug}":`, message);
    return { ok: false, error: `Failed to parse RSS feed: ${message}`, reason: "fetch_failed" };
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
