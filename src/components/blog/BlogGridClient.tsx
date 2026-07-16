"use client";

import { useEffect, useMemo, useState } from "react";
import { BlogGrid } from "./BlogGrid";
import type { BlogPost } from "@/types/blogPost";

/** Fisher–Yates shuffle — returns a new array, never mutates the input. */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface BlogGridClientProps {
  posts: BlogPost[];
  /** When true, the order is randomized after mount (i.e. on every refresh).
   *  Only used on the unfiltered first page so SEO/caching/links stay stable. */
  randomize?: boolean;
  emptyMessage?: string;
}

export function BlogGridClient({ posts, randomize = false, emptyMessage }: BlogGridClientProps) {
  // `mounted` is false during SSR and the first client render, so the initial
  // client HTML matches the server (canonical order) — no hydration mismatch.
  // After mount it flips to true and we shuffle, giving a fresh order per visit.
  const [mounted, setMounted] = useState(false);

  // Intentionally flips to true only after hydration. This is the standard
  // "mounted" pattern: SSR and the first client render stay identical (canonical
  // order) to avoid a hydration mismatch, then we shuffle on the client. The
  // lint rule flags setState-in-effect, but here it's required and safe — it
  // runs exactly once, post-hydration, and never loops.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const ordered = useMemo(() => {
    if (!randomize || !mounted) return posts;
    return shuffle(posts);
  }, [randomize, mounted, posts]);

  return <BlogGrid posts={ordered} emptyMessage={emptyMessage} />;
}
