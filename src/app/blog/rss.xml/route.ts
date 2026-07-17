import { getAllPosts, isHashnodeConfigured } from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import type { BlogPost } from "@/types/blogPost";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;")
    .replaceAll("'", "&" + "apos;");
}

export async function GET() {
  const result = await getAllPosts();
  // Placeholders are for local dev only (Hashnode not configured). When the
  // publication IS configured we never publish demo posts — on a fetch failure
  // or empty feed we emit a real (possibly empty) feed instead.
  let posts: BlogPost[];
  if (!isHashnodeConfigured()) {
    posts = placeholderBlogPosts;
  } else if (result.ok) {
    posts = result.data;
  } else {
    posts = [];
  }

  const sorted = [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const items = sorted
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid>${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.brief)}</description>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Technical and community-building writing from ${escapeXml(SITE_NAME)}.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
