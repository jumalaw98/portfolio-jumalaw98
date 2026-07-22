import type { BlogTag } from "./blogPost";

/**
 * Discriminated post summary shared by both content sources (Velite & Hashnode).
 * The listing page merges both arrays and sorts by date.
 */
export interface BlogPostSummary {
  /** Identifies the content source for routing & rendering decisions. */
  source: "portfolio" | "hashnode";
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string; // ISO date
  readTimeInMinutes: number;
  /** External canonical URL for Hashnode; internal `/blog/[slug]` for portfolio. */
  url: string;
  tags: BlogTag[];
}
