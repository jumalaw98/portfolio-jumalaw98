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
  contentHtml: string;
  ogImageUrl: string | null;
}
