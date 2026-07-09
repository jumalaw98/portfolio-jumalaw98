import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { TagFilter } from "@/components/blog/TagFilter";
import { SearchBox } from "@/components/blog/SearchBox";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllPosts, getAllTagsFromPosts, isHashnodeConfigured } from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";
import { SOCIAL_LINKS } from "@/lib/constants";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

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
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag, q } = await searchParams;

  const livePosts = await getAllPosts();
  const usingPlaceholders = !isHashnodeConfigured() || livePosts.length === 0;
  const allPosts = usingPlaceholders ? placeholderBlogPosts : livePosts;

  const tags = getAllTagsFromPosts(allPosts);

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

  const showFeatured = !tag && !q && sortedPosts.length > 0;
  const featured = showFeatured ? sortedPosts[0] : null;
  const gridPosts = showFeatured ? sortedPosts.slice(1) : sortedPosts;

  return (
    <Container className="py-16">
      <JsonLd data={breadcrumbJsonLd([{ name: "Blog", path: "/blog" }])} />

      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
        <p className="mt-4 text-lg text-text-body">
          Technical lessons from real deployments, and what running technical
          communities across East Africa has taught me about shipping software.{" "}
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
          Showing placeholder posts — set <code>HASHNODE_PUBLICATION_HOST</code> in
          your environment to pull the real, live feed from Hashnode.
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
      <h2 className="sr-only">
        {tag || q ? "Filtered Articles" : "All Articles"}
      </h2>

      <RevealSection className="mt-8">
        <BlogGrid
          posts={gridPosts}
          emptyMessage="No articles match that search or tag yet."
        />
      </RevealSection>
    </Container>
  );
}
