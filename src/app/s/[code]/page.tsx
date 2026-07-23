import { redirect, notFound } from "next/navigation";
import { getAllPosts, isHashnodeConfigured, RSS_FEED_MAX_SIZE } from "@/lib/hashnode";
import { getPortfolioPosts } from "@/lib/velite";
import { placeholderBlogPosts } from "@/content/blog-placeholder";

export const revalidate = 3600; // match blog revalidation window

interface ShortLinkPageProps {
  readonly params: Promise<{ code: string }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params;

  // 1. Check portfolio (Velite MDX) posts first
  const portfolioPosts = await getPortfolioPosts();
  const portfolioPost = portfolioPosts.find((p) => p.shortId === code);
  if (portfolioPost) {
    redirect(`/blog/${portfolioPost.slug}`);
  }

  const configured = isHashnodeConfigured();
  const hasRealPortfolioContent = portfolioPosts.length > 0;
  const usingPlaceholders = !configured && !hasRealPortfolioContent;

  // 2. Check Hashnode posts
  if (configured) {
    const result = await getAllPosts(RSS_FEED_MAX_SIZE);

    // On fetch failure: propagate the error so ISR can retain the previous
    // good response instead of serving placeholder redirects.
    if (!result.ok) notFound();

    const post = result.data.find((p) => p.shortId === code);
    if (!post) notFound();

    redirect(`/blog/${post.slug}`);
  }

  // 3. Check placeholder posts (dev/staging without Hashnode and no local posts)
  if (usingPlaceholders) {
    const placeholderPost = placeholderBlogPosts.find((p) => p.shortId === code);
    if (placeholderPost) {
      redirect(`/blog/${placeholderPost.slug}`);
    }
  }

  notFound();
}
