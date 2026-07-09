import type { BlogPost, BlogPostDetail } from "@/types/blogPost";
import { hashnodeRequest, HashnodeApiError } from "./client";
import { POSTS_QUERY, POST_BY_SLUG_QUERY } from "./queries";
import type {
  HashnodePostSummary,
  HashnodePostFull,
  PostsQueryResponse,
  PostBySlugQueryResponse,
} from "./types";

const PUBLICATION_HOST = process.env.HASHNODE_PUBLICATION_HOST;

/** True once a real Hashnode publication is configured. */
export function isHashnodeConfigured(): boolean {
  return Boolean(PUBLICATION_HOST);
}

function mapSummary(node: HashnodePostSummary): BlogPost {
  return {
    slug: node.slug,
    title: node.title,
    subtitle: node.subtitle,
    brief: node.brief,
    coverImageUrl: node.coverImage?.url ?? null,
    publishedAt: node.publishedAt,
    readTimeInMinutes: node.readTimeInMinutes,
    url: node.url,
    tags: node.tags ?? [],
    author: {
      name: node.author.name,
      username: node.author.username,
      profilePictureUrl: node.author.profilePicture,
    },
  };
}

function mapFull(node: HashnodePostFull): BlogPostDetail {
  return {
    ...mapSummary(node),
    contentHtml: node.content.html,
    ogImageUrl: node.ogMetaData?.image ?? node.coverImage?.url ?? null,
  };
}

/**
 * Fetches posts for the listing page. Pulls up to `limit` posts in one
 * request — plenty for a personal blog's volume, and keeps tag-filtering /
 * search simple (done in-app over this set, see note in app/blog/page.tsx)
 * rather than depending on unconfirmed server-side filter/search arguments.
 */
export async function getAllPosts(limit = 50): Promise<BlogPost[]> {
  if (!PUBLICATION_HOST) return [];

  try {
    const data = await hashnodeRequest<PostsQueryResponse>(
      POSTS_QUERY,
      { host: PUBLICATION_HOST, first: limit, after: null },
      { revalidate: 3600, tags: ["hashnode-posts"] },
    );

    return (data.publication?.posts.edges ?? []).map((edge) => mapSummary(edge.node));
  } catch (error) {
    console.error("Failed to fetch Hashnode posts:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  if (!PUBLICATION_HOST) return null;

  try {
    const data = await hashnodeRequest<PostBySlugQueryResponse>(
      POST_BY_SLUG_QUERY,
      { host: PUBLICATION_HOST, slug },
      { revalidate: 3600, tags: [`hashnode-post-${slug}`] },
    );

    const post = data.publication?.post;
    return post ? mapFull(post) : null;
  } catch (error) {
    if (error instanceof HashnodeApiError) {
      console.error(`Failed to fetch Hashnode post "${slug}":`, error.message);
    } else {
      console.error(`Failed to fetch Hashnode post "${slug}":`, error);
    }
    return null;
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
export function getRelatedPosts(
  post: BlogPost,
  allPosts: BlogPost[],
  limit = 3,
): BlogPost[] {
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
