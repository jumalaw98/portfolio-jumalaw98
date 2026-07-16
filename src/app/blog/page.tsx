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

const PAGE_SIZE = 18;

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
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag, q, page } = await searchParams;

  const result = await getAllPosts();
  const configured = isHashnodeConfigured();

  // Only fall back to placeholders when Hashnode is NOT configured (dev mode).
  // A real fetch failure must be visible, not silently masked as placeholders.
  const usingPlaceholders = !configured;
  const fetchFailed = configured && !result.ok;
  const allPosts = usingPlaceholders ? placeholderBlogPosts : result.ok ? result.data : [];

  if (fetchFailed && result.ok === false) {
    console.error("Hashnode feed fetch failed:", result.error);
  }

  const allTags = getAllTagsFromPosts(allPosts);

  // Cap the visible filter chips at 5 to keep the UI tidy when the
  // publication has many tags. Pick the 5 most-used tags, but always keep the
  // currently active tag in the list so its highlighted state never vanishes.
  const MAX_TAGS = 5;
  const tags = (() => {
    if (allTags.length <= MAX_TAGS) return allTags;
    const byCount = [...allTags].sort((a, b) => {
      const count = (slug: string) =>
        allPosts.filter((p) => p.tags.some((t) => t.slug === slug)).length;
      return count(b.slug) - count(a.slug);
    });
    const top = byCount.slice(0, MAX_TAGS);
    if (tag && !top.some((t) => t.slug === tag)) {
      const active = allTags.find((t) => t.slug === tag);
      if (active) top[top.length - 1] = active;
    }
    return top;
  })();

  // In-app filtering over the fetched set. Hashnode's public API doesn't
  // expose a stable full-text search endpoint, so this is a pragmatic
  // "search within what we've loaded" rather than a server-side search —
  // fine at personal-blog volume; see README for an Algolia/Orama upgrade path.
  let filteredPosts = allPosts;
  if (tag) {
    filteredPosts = filteredPosts.filter((p) => p.tags.some((t) => t.slug === tag));
  }
  if (q) {
    const needle = q.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.brief.toLowerCase().includes(needle) ||
        (p.subtitle?.toLowerCase().includes(needle) ?? false),
    );
  }

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  // Paginate the grid at PAGE_SIZE per view. The featured hero is an extra
  // element shown only on the unfiltered first page.
  const currentPage = Math.min(
    Math.max(1, Number.parseInt(page ?? "1", 10) || 1),
    Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE)),
  );
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE));

  // Featured hero only on the unfiltered first page — never on later pages.
  const showFeatured = !tag && !q && currentPage === 1 && sortedPosts.length > 0;
  const featured = showFeatured ? sortedPosts[0] : null;
  const restPosts = showFeatured ? sortedPosts.slice(1) : sortedPosts;
  const gridPosts = restPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Randomize the grid order on every refresh, but only on the unfiltered
  // first page — keeps tag/search/pagination deterministic and SEO-stable.
  const randomize = !tag && !q && currentPage === 1;

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
          randomize={randomize}
          emptyMessage="No articles match that search or tag yet."
        />
      </RevealSection>

      <Suspense fallback={<div className="mt-10 h-10" />}>
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </Suspense>
    </Container>
  );
}
