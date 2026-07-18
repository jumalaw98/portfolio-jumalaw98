import { redirect, notFound } from "next/navigation";
import { getAllPosts, isHashnodeConfigured } from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";

export const revalidate = 3600; // match blog revalidation window

interface ShortLinkPageProps {
  readonly params: Promise<{ code: string }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params;

  let posts;
  if (isHashnodeConfigured()) {
    const result = await getAllPosts();
    if (!result.ok) {
      // If Hashnode fetch fails, fall back to placeholders so dev/staging
      // short links still work. In production this should not normally happen.
      posts = placeholderBlogPosts;
    } else {
      posts = result.data;
    }
  } else {
    posts = placeholderBlogPosts;
  }

  const post = posts.find((p) => p.shortId === code);
  if (!post) notFound();

  redirect(`/blog/${post.slug}`);
}
