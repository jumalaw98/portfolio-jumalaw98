import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { PostNavigation } from "@/components/blog/PostNavigation";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatBlogDate, formatReadTime } from "@/components/blog/blogFormat";
import {
  getAllPosts,
  getAdjacentPosts,
  getRelatedPosts,
  isHashnodeConfigured,
} from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { breadcrumbJsonLd } from "@/lib/seo";
import type { BlogPostDetail } from "@/types/blogPost";

export const revalidate = 3600;

interface BlogPostPageProps {
  readonly params: Promise<{ slug: string }>;
}

async function resolvePost(slug: string): Promise<{
  post: BlogPostDetail | null;
  allPosts: BlogPostDetail[];
  usingPlaceholders: boolean;
  fetchFailed: boolean;
  isMissing: boolean; // true when the post definitively doesn't exist
}> {
  if (!isHashnodeConfigured()) {
    const post = placeholderBlogPosts.find((p) => p.slug === slug) ?? null;
    return {
      post,
      allPosts: placeholderBlogPosts,
      usingPlaceholders: true,
      fetchFailed: false,
      isMissing: !post,
    };
  }

  // Single RSS fetch — avoids duplicate network requests and keeps the
  // lookup consistent with the listing page. Older posts that have fallen
  // outside the RSS window will not be found here (a known architectural
  // limitation without a persistent index).
  const result = await getAllPosts();

  if (!result.ok) {
    // Fetch failure — not the same as "post not found". Return null post so
    // the page shows the failure banner without a 404 (ISR can thus preserve
    // the last good cached page instead of losing it to a transient blip).
    return {
      post: null,
      allPosts: [],
      usingPlaceholders: false,
      fetchFailed: true,
      isMissing: false,
    };
  }

  const allPosts = result.data as BlogPostDetail[];
  const post = allPosts.find((p) => p.slug === slug) ?? null;
  return { post, allPosts, usingPlaceholders: false, fetchFailed: false, isMissing: !post };
}

export async function generateStaticParams() {
  if (!isHashnodeConfigured()) {
    return placeholderBlogPosts.map((p) => ({ slug: p.slug }));
  }
  const result = await getAllPosts();
  const posts = result.ok ? result.data : [];
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await resolvePost(slug);

  if (!post) {
    return {
      title: `Post not found — ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.ogImageUrl ?? post.coverImageUrl ?? undefined;
  // Natural keyword targeting: lead with the post's own tags rather than
  // stuffing unrelated terms — each tag is already a real topic of the post.
  const keywords = post.tags.map((t) => t.name);

  return {
    title: `${post.title} — ${SITE_NAME}`,
    description: post.brief,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: { canonical: url },
    authors: [{ name: post.author.name }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.brief,
      url,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags.map((t) => t.name),
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.brief,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const { post, allPosts, usingPlaceholders, fetchFailed, isMissing } = await resolvePost(slug);

  // Transient fetch failure — throw so Next.js ISR retains the last cached
  // version instead of replacing it with a 404. A genuine "not found" (post
  // outside the RSS window, deleted, etc.) generates a real 404.
  if (fetchFailed) {
    throw new Error("Failed to fetch blog post from Hashnode");
  }

  if (isMissing) {
    notFound();
  }

  // Narrow post to BlogPostDetail — the guards above exit before null is possible here.
  if (!post) {
    throw new Error("Invariant: post must be non-null after fetch/notFound guards");
  }

  const { previous, next } = getAdjacentPosts(post, allPosts);
  const related = getRelatedPosts(post, allPosts);
  const articleUrl = `${SITE_URL}/blog/${post.slug}`;
  const shortUrl = `${SITE_URL}/s/${post.shortId}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.brief,
    image: post.ogImageUrl ?? post.coverImageUrl ?? undefined,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Person", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <article>
      <JsonLd data={articleJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <ReadingProgress />

      {/* Header and cover image render statically (no scroll-reveal) — the
          cover image is the likely LCP element on this page, so it's kept
          out of any opacity/transform animation. Everything below fades in
          as it scrolls into view. */}
      <header className="border-b border-border bg-brand-blue-tint py-14">
        <Container className="max-w-3xl">
          {usingPlaceholders ? (
            <p className="mb-4 rounded-md border border-brand-orange-light bg-brand-orange-tint px-4 py-2 text-sm text-brand-orange-dark">
              Placeholder post — connect <code>HASHNODE_PUBLICATION_HOST</code> to show real
              Hashnode content here.
            </p>
          ) : null}

          {fetchFailed ? (
            <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              This article loaded from cache, but we couldn&apos;t refresh the latest from Hashnode.
              The content below is still valid.
            </p>
          ) : null}

          <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
            <Link href="/blog" className="hover:text-brand-blue">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span aria-current="page">{post.title}</span>
          </nav>

          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag.slug} tone="blue">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          {post.subtitle ? <p className="mt-3 text-lg text-text-muted">{post.subtitle}</p> : null}

          <div className="mt-6 flex items-center gap-3">
            {post.author.profilePictureUrl ? (
              <div className="relative h-9 w-9 overflow-hidden rounded-full">
                <Image
                  src={post.author.profilePictureUrl}
                  alt={post.author.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="text-sm">
              <p className="font-medium text-brand-ink">{post.author.name}</p>
              <p className="text-text-muted">
                {formatBlogDate(post.publishedAt)} · {formatReadTime(post.readTimeInMinutes)}
              </p>
            </div>
          </div>
        </Container>
      </header>

      {post.coverImageUrl ? (
        <Container className="max-w-3xl py-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      ) : null}

      <Container className="grid gap-10 pb-16 md:grid-cols-[1fr_220px] md:items-start">
        <div className="max-w-3xl">
          <RevealSection>
            <ArticleContent html={post.contentHtml} />
          </RevealSection>

          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            <p className="text-sm font-medium text-text-body">Share this article</p>
            <ShareButtons title={post.title} url={articleUrl} shortUrl={shortUrl} />
          </div>

          <div className="mt-10">
            <PostNavigation previous={previous} next={next} />
          </div>

          <RevealSection className="mt-14">
            <RelatedPosts posts={related} />
          </RevealSection>
        </div>

        <aside className="hidden md:block">
          <TableOfContents />
        </aside>
      </Container>
    </article>
  );
}
