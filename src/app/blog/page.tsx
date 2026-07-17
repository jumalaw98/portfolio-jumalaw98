import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { BlogGridClient } from "@/components/blog/BlogGridClient";
import { Pagination } from "@/components/blog/Pagination";
import { TagFilter } from "@/components/blog/TagFilter";
import { SearchBox } from "@/components/blog/SearchBox";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllPosts, getAllTagsFromPosts, isHashnodeConfigured } from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";
import { SOCIAL_LINKS } from "@/lib/constants";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import type { BlogPost, BlogTag } from "@/types/blogPost";
import type { HashnodeResult } from "@/lib/hashnode/rss";

const PAGE_SIZE = 18;
const MAX_TAGS = 5;

export const revalidate = 3600; // ISR — new Hashnode posts appear hourly without a redeploy

const blogPageMeta = pageMetadata({
  title: "Blog — DevOps, React & Community Building Notes",
  description:
    "Technical lessons on React, Next.js, and DevOps from real deployments, plus community-building notes from leading tech communities in Nairobi — read directly here, no redirect to Hashnode required.",
  path: "/blog",
});

export const metadata: Metadata = {
  ...blogPageMeta,
  alternates: {
    ...blogPageMeta.alternates,
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

interface BlogPageProps {
  readonly searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}

// ---------------------------------------------------------------------------
// Pure helpers extracted from the page component to keep cognitive complexity
// within the SonarQube threshold and eliminate nested ternaries / deep nesting.
// ---------------------------------------------------------------------------

/** Resolve the post list without a nested ternary. */
function resolvePosts(
  configured: boolean,
  result: HashnodeResult<BlogPost[]>,
): { posts: BlogPost[]; usingPlaceholders: boolean; fetchFailed: boolean } {
  const usingPlaceholders = !configured;
  const fetchFailed = configured && !result.ok;

  let posts: BlogPost[];
  if (usingPlaceholders) {
    posts = placeholderBlogPosts as BlogPost[];
  } else if (result.ok) {
    posts = result.data;
  } else {
    posts = [];
  }

  return { posts, usingPlaceholders, fetchFailed };
}

/** Count how many posts carry a given tag slug. */
function tagCount(posts: BlogPost[], slug: string): number {
  return posts.filter((p) => p.tags.some((t) => t.slug === slug)).length;
}

/**
 * Cap the visible filter chips at MAX_TAGS. Pick the most-used tags, but
 * always keep the currently active tag in the list so its highlighted state
 * never vanishes.
 */
function getTopTags(allTags: BlogTag[], posts: BlogPost[], activeTag?: string): BlogTag[] {
  if (allTags.length <= MAX_TAGS) return allTags;

  const byCount = [...allTags].sort((a, b) => tagCount(posts, b.slug) - tagCount(posts, a.slug));
  const top = byCount.slice(0, MAX_TAGS);

  if (activeTag && !top.some((t) => t.slug === activeTag)) {
    const active = allTags.find((t) => t.slug === activeTag);
    if (active) top[top.length - 1] = active;
  }

  return top;
}

/** Apply in-app tag and full-text filters, then sort newest-first. */
function filterAndSortPosts(posts: BlogPost[], tag?: string, q?: string): BlogPost[] {
  let filtered = posts;

  if (tag) {
    filtered = filtered.filter((p) => p.tags.some((t) => t.slug === tag));
  }
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.brief.toLowerCase().includes(needle) ||
        (p.subtitle?.toLowerCase().includes(needle) ?? false),
    );
  }

  return [...filtered].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Derive pagination values and the grid slice for the current page. */
function paginatePosts(
  sortedPosts: BlogPost[],
  rawPage: string | undefined,
  pageSize: number,
  showFeatured = false,
) {
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1), totalPages);

  const featured = showFeatured && sortedPosts.length > 0 ? sortedPosts[0] : null;
  const restPosts = featured ? sortedPosts.slice(1) : sortedPosts;
  const gridPosts = restPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return { currentPage, totalPages, featured, gridPosts };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag, q, page } = await searchParams;

  const result = await getAllPosts();
  const configured = isHashnodeConfigured();

  const { posts: allPosts, usingPlaceholders, fetchFailed } = resolvePosts(configured, result);

  if (fetchFailed && !result.ok) {
    console.error("Hashnode feed fetch failed:", result.error);
  }

  const allTags = getAllTagsFromPosts(allPosts);
  const tags = getTopTags(allTags, allPosts, tag);

  const sortedPosts = filterAndSortPosts(allPosts, tag, q);

  // Featured hero only on the unfiltered first page — never on later pages
  // or paginated/filtered views. The featured decision is now separate from
  // the pagination logic so filtered pages get correct pagination (issue 3).
  const showFeatured = !tag && !q && (!page || page === "1");
  const { currentPage, totalPages, featured, gridPosts } = paginatePosts(
    sortedPosts,
    page,
    PAGE_SIZE,
    showFeatured,
  );

  // Randomize the grid order on every refresh, but only on the unfiltered
  // first page — keeps tag/search/pagination deterministic and SEO-stable.
  // A per-request seed ensures SSR and client produce the same shuffled
  // order, preventing post-hydration CLS (issue 7).
  const randomize = !tag && !q && currentPage === 1;
  const randomSeed: string | null = randomize ? crypto.randomUUID() : null;

  return (
    <Container className="py-16">
      <JsonLd data={breadcrumbJsonLd([{ name: "Blog", path: "/blog" }])} />

      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
        <p className="mt-4 text-lg text-text-body">
          Technical lessons from real deployments, and what running technical communities across
          East Africa has taught me about shipping software.{" "}
          <a
            href={SOCIAL_LINKS.hashnode}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-blue hover:text-brand-blue-dark"
          >
            Also on Hashnode →
          </a>
        </p>
      </div>

      {usingPlaceholders ? (
        <p className="mt-8 rounded-md border border-brand-orange-light bg-brand-orange-tint px-4 py-3 text-sm text-brand-orange-dark">
          Showing placeholder posts — set <code>HASHNODE_PUBLICATION_HOST</code> in your environment
          to pull the real, live feed from Hashnode.
        </p>
      ) : null}

      {fetchFailed ? (
        <p className="mt-8 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t load the latest posts from Hashnode right now. Please check back shortly
          — the rest of the site is unaffected.
        </p>
      ) : null}

      {featured ? (
        <RevealSection className="mt-10">
          <FeaturedPost post={featured} />
        </RevealSection>
      ) : null}

      <Suspense fallback={<div className="mt-10 h-24" />}>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TagFilter tags={tags} />
          <div className="w-full sm:max-w-xs">
            <SearchBox />
          </div>
        </div>
      </Suspense>

      {/* Visually hidden — keeps the heading hierarchy valid even when no
          featured post renders (e.g. while filtering by tag/search). */}
      <h2 className="sr-only">{tag || q ? "Filtered Articles" : "All Articles"}</h2>

      <RevealSection className="mt-8">
        <BlogGridClient
          posts={gridPosts}
          randomSeed={randomSeed}
          emptyMessage="No articles match that search or tag yet."
        />
      </RevealSection>

      <Suspense fallback={<div className="mt-10 h-10" />}>
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </Suspense>
    </Container>
  );
}
