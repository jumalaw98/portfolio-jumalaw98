import { redirect, notFound } from "next/navigation";
import { getAllPosts, isHashnodeConfigured, RSS_FEED_MAX_SIZE } from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";

export const revalidate = 3600; // match blog revalidation window

interface ShortLinkPageProps {
  readonly params: Promise<{ code: string }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params;

  if (isHashnodeConfigured()) {
    const result = await getAllPosts(RSS_FEED_MAX_SIZE);

    // On fetch failure: propagate the error so ISR can retain the previous
    // good response instead of serving placeholder redirects (which would
    // not match real short codes and produce wrong 404s / redirects).
    if (!result.ok) notFound();

    const post = result.data.find((p) => p.shortId === code);
    if (!post) notFound();

    redirect(`/blog/${post.slug}`);
  }

  // Hashnode not configured — dev/staging with placeholder posts only.
  const post = placeholderBlogPosts.find((p) => p.shortId === code);
  if (!post) notFound();

  redirect(`/blog/${post.slug}`);
}
