import { BlogCard } from "./BlogCard";
import type { BlogPost } from "@/types/blogPost";

interface BlogGridProps {
  posts: BlogPost[];
  emptyMessage?: string;
}

export function BlogGrid({
  posts,
  emptyMessage = "No posts match your filters yet.",
}: BlogGridProps) {
  if (posts.length === 0) {
    return <p className="py-12 text-center text-text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, i) => (
        <BlogCard key={post.slug} post={post} priority={i === 0} index={i} />
      ))}
    </div>
  );
}
