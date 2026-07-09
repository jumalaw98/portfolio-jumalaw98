import { BlogGrid } from "./BlogGrid";
import type { BlogPost } from "@/types/blogPost";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-posts-heading" className="border-t border-border pt-10">
      <h2 id="related-posts-heading" className="text-xl font-semibold text-brand-ink">
        Related Articles
      </h2>
      <div className="mt-6">
        <BlogGrid posts={posts} />
      </div>
    </section>
  );
}
