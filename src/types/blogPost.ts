import type { SanitizedHtml } from "@/lib/html-sanitize";

export interface BlogTag {
  name: string;
  slug: string;
}

export interface BlogAuthor {
  name: string;
  username: string;
  profilePictureUrl: string | null;
}

export interface BlogPost {
  slug: string;
  shortId: string; // deterministic 6-char code from slug, used for /s/[code] redirect
  title: string;
  subtitle: string | null;
  brief: string;
  coverImageUrl: string | null;
  publishedAt: string; // ISO date
  readTimeInMinutes: number;
  url: string; // canonical Hashnode URL (used for "read on Hashnode" links, RSS, etc.)
  tags: BlogTag[];
  author: BlogAuthor;
}

export interface BlogPostDetail extends BlogPost {
  /**
   * Article HTML that has passed through `sanitizeExternalHtml()`.
   *
   * `SanitizedHtml` is a nominal brand, so this field can only be populated by
   * the sanitizer — see src/lib/html-sanitize.ts. Never assign a raw string
   * here; that would reintroduce an XSS sink at `dangerouslySetInnerHTML`.
   */
  contentHtml: SanitizedHtml;
  ogImageUrl: string | null;
}
