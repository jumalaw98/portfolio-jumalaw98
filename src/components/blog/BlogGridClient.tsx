"use client";

import { useMemo } from "react";
import { BlogGrid } from "./BlogGrid";
import { seededShuffle } from "@/lib/seeded-shuffle";
import type { BlogPost } from "@/types/blogPost";

interface BlogGridClientProps {
  readonly posts: BlogPost[];
  /**
   * When non-null the grid is shuffled using this seed, producing identical
   * order on the server (SSR) and the first client render — no hydration
   * mismatch and no post-mount reflow/CLS. The seed is generated per-request
   * by the server component, so each visitor gets a fresh order.
   * When null the grid preserves the canonical (publish-date) order.
   */
  readonly randomSeed?: string | null;
  readonly emptyMessage?: string;
}

export function BlogGridClient({ posts, randomSeed = null, emptyMessage }: BlogGridClientProps) {
  // Seeded shuffle: same seed → identical order on server and client.
  // No `mounted` state needed — no hydration mismatch, no post-mount reorder.
  const ordered = useMemo(() => {
    if (!randomSeed) return posts;
    return seededShuffle(posts, randomSeed);
  }, [randomSeed, posts]);

  return <BlogGrid posts={ordered} emptyMessage={emptyMessage} />;
}
