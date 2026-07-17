"use client";

import { useMemo } from "react";
import { BlogGrid } from "./BlogGrid";
import type { BlogPost } from "@/types/blogPost";

/**
 * Simple seeded PRNG (mulberry32). Given the same seed string it always
 * produces the same sequence — this keeps SSR and client render identical
 * and avoids post-hydration layout shift (CLS).
 *
 * Used ONLY for cosmetic blog-card shuffling — not a security context.
 * NOSONAR (S2245 warns about PRNGs in security-sensitive positions).
 */
function mulberry32(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle seeded by a string key — deterministic, no mutation. */
function seededShuffle<T>(input: T[], seed: string): T[] {
  const arr = [...input];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
