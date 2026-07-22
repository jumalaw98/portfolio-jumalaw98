import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ArticleContent } from "@/components/blog/ArticleContent";
import MdxContent from "@/components/blog/MdxContent";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { PostNavigation } from "@/components/blog/PostNavigation";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatBlogDate, formatReadTime } from "@/components/blog/blogFormat";
import {
  getAllPosts,
  getAllPostDetails,
  isHashnodeConfigured,
  RSS_FEED_MAX_SIZE,
} from "@/lib/hashnode";
import { getPortfolioPostBySlug, getAllPortfolioDetails } from "@/lib/velite";
import type { PortfolioPostDetail } from "@/lib/velite";
import { placeholderBlogPosts } from "@/content/blog-placeholder";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { breadcrumbJsonLd } from "@/lib/seo";
import type { BlogPostDetail } from "@/types/blogPost";

export const revalidate = 3600;

interface BlogPostPageProps {
  readonly params: Promise<{ slug: string }>;
}

// ── Shared helpers for adjacent / related posts ──────────────────────────────
// Generic over any type that has the fields these operations need, so the same
// logic works for BlogPostDetail and PortfolioPostDetail.

function getAdjacentPosts<T extends { publishedAt: string; slug: string }>(
  post: T,
  allPosts: T[],
): { previous: T | null; next: T | null } {
  const sorted = [...allPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const idx = sorted.findIndex((p) => p.slug === post.slug);
  return {
    previous: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

function getRelatedPosts<T extends { tags: { slug: string }[]; slug: string }>(
  post: T,
  allPosts: T[],
  limit = 3,
): T[] {
  const myTags = new Set(post.tags.map((t) => t.slug));
  return allPosts
    .filter((p) => p.slug !== post.slug && p.tags.some((t) => myTags.has(t.slug)))
    .slice(0, limit);
}

// ── Resolution ───────────────────────────────────────────────────────────────

type ResolvedPost =
  | {
      kind: "portfolio";
      post: PortfolioPostDetail;
      allPosts: (BlogPostDetail | PortfolioPostDetail)[];
      usingPlaceholders?: boolean;
      fetchFailed?: boolean;
    }
  | {
      kind: "hashnode";
      post: BlogPostDetail;
      allPosts: BlogPostDetail[];
      usingPlaceholders: boolean;
      fetchFailed: boolean;
    }
  | {
      kind: "missing";
      post: null;
      allPosts: [];
      usingPlaceholders?: boolean;
      fetchFailed?: boolean;
    };

async function resolvePost(slug: string): Promise<ResolvedPost> {
  // 1. Check portfolio (Velite MDX) posts first.
  const portfolioPost = await getPortfolioPostBySlug(slug);
  if (portfolioPost) {
    const portfolioPosts = await getAllPortfolioDetails();

    // Merge with Hashnode posts so adjacent/related span both sources.
    const hashnodeResult = await getAllPostDetails(RSS_FEED_MAX_SIZE);
    const hashnodePosts = hashnodeResult.ok ? hashnodeResult.data : [];

    const allPosts = [...portfolioPosts, ...hashnodePosts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    return { kind: "portfolio", post: portfolioPost, allPosts };
  }

  // 2. Fall through to Hashnode / placeholders.
  if (!isHashnodeConfigured()) {
    const post = placeholderBlogPosts.find((p) => p.slug === slug) ?? null;
    if (post) {
      return {
        kind: "hashnode",
        post: post as BlogPostDetail,
        allPosts: placeholderBlogPosts as BlogPostDetail[],
        usingPlaceholders: true,
        fetchFailed: false,
      };
    }
    return {
      kind: "missing",
      post: null,
      allPosts: [],
      usingPlaceholders: true,
      fetchFailed: false,
    };
  }

  const result = await getAllPostDetails(RSS_FEED_MAX_SIZE);

  if (!result.ok) {
    // Fetch failure — not "not found".  Return null so the page shows an
    // error banner (ISR preserves the last good cached version).
    return {
      kind: "missing",
      post: null,
      allPosts: [],
      fetchFailed: true,
      usingPlaceholders: false,
    };
  }

  const allPosts = result.data;
  const post = allPosts.find((p) => p.slug === slug) ?? null;
  if (post) {
    return {
      kind: "hashnode",
      post,
      allPosts,
      usingPlaceholders: false,
      fetchFailed: false,
    };
  }
  return {
    kind: "missing",
    post: null,
    allPosts: [],
    usingPlaceholders: false,
    fetchFailed: false,
  };
}

// ── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Portfolio slugs
  const portfolioPosts = await getAllPortfolioDetails();
  const portfolioSlugs = portfolioPosts.map((p) => ({ slug: p.slug }));

  // Hashnode slugs
  let hashnodeSlugs: { slug: string }[] = [];
  if (!isHashnodeConfigured()) {
    hashnodeSlugs = placeholderBlogPosts.map((p) => ({ slug: p.slug }));
  } else {
    const result = await getAllPosts();
    const posts = result.ok ? result.data : [];
    hashnodeSlugs = posts.map((p) => ({ slug: p.slug }));
  }

  return [...portfolioSlugs, ...hashnodeSlugs];
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePost(slug);

  if (resolved.kind === "missing" || !resolved.post) {
    return {
      title: `Post not found — ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const { post } = resolved;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image =
    "ogImageUrl" in post && post.ogImageUrl ? post.ogImageUrl : (post.coverImageUrl ?? undefined);
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const resolved = await resolvePost(slug);

  if (resolved.kind === "missing") {
    // Transient fetch failure — Next.js ISR retains the last cached version.
    // A genuine "not found" generates a 404.
    // We differentiate by checking if resolved is a hashnode failure or truly missing.
    if (resolved.post === null && resolved.fetchFailed) {
      throw new Error("Failed to fetch blog post from Hashnode");
    }
    notFound();
  }

  const { post, allPosts } = resolved;
  const isPortfolio = resolved.kind === "portfolio";
  const portfolioPost = isPortfolio ? (post as PortfolioPostDetail) : null;
  const hashnodePost = !isPortfolio ? (post as BlogPostDetail) : null;

  const { previous, next } = getAdjacentPosts(post, allPosts as typeof allPosts);
  const related = getRelatedPosts(post, allPosts as typeof allPosts);
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

  // Render header source/warning banner alerts
  let sourceBanner: React.ReactNode = null;
  if (isPortfolio) {
    sourceBanner = (
      <p className="mb-4 rounded-md border border-brand-blue-light bg-brand-blue-tint px-4 py-2 text-sm text-brand-blue-dark">
        Published directly from the portfolio — this post is authored in MDX and managed through the
        site&apos;s own content pipeline.
      </p>
    );
  } else if (resolved.usingPlaceholders) {
    sourceBanner = (
      <p className="mb-4 rounded-md border border-brand-orange-light bg-brand-orange-tint px-4 py-2 text-sm text-brand-orange-dark">
        Placeholder post — connect <code>HASHNODE_PUBLICATION_HOST</code> to show real Hashnode
        content here.
      </p>
    );
  } else if (resolved.fetchFailed) {
    sourceBanner = (
      <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
        This article loaded from cache, but we couldn&apos;t refresh the latest from Hashnode. The
        content below is still valid.
      </p>
    );
  }

  const subtitleElement = post.subtitle ? (
    <p className="mt-3 text-lg text-text-muted">{post.subtitle}</p>
  ) : null;

  const authorImage = post.author.profilePictureUrl ? (
    <div className="relative h-9 w-9 overflow-hidden rounded-full">
      <Image
        src={post.author.profilePictureUrl}
        alt={post.author.name}
        fill
        sizes="36px"
        className="object-cover"
      />
    </div>
  ) : null;

  const coverImageElement = post.coverImageUrl ? (
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
  ) : null;

  let contentElement: React.ReactNode = null;
  if (portfolioPost) {
    contentElement = <MdxContent code={portfolioPost.mdxBody} />;
  } else if (hashnodePost) {
    contentElement = <ArticleContent html={hashnodePost.contentHtml} />;
  }

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

      <header className="border-b border-border bg-brand-blue-tint py-14">
        <Container className="max-w-3xl">
          {sourceBanner}

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
          {subtitleElement}

          <div className="mt-6 flex items-center gap-3">
            {authorImage}
            <div className="text-sm">
              <p className="font-medium text-brand-ink">{post.author.name}</p>
              <p className="text-text-muted">
                {formatBlogDate(post.publishedAt)} · {formatReadTime(post.readTimeInMinutes)}
              </p>
            </div>
          </div>
        </Container>
      </header>

      {coverImageElement}

      <Container className="grid gap-10 pb-16 md:grid-cols-[1fr_220px] md:items-start">
        <div className="max-w-3xl">
          <RevealSection>{contentElement}</RevealSection>

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
