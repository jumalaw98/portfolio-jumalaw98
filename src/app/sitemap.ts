import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { mvpProjects } from "@/content/projects";
import { getAllPosts, isHashnodeConfigured } from "@/lib/hashnode";
import { getPortfolioPosts } from "@/lib/velite";
import { placeholderBlogPosts } from "@/content/blog-placeholder";
import type { BlogPost } from "@/types/blogPost";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/projects", "/about", "/contact", "/community", "/blog"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
    }),
  );

  const projectRoutes = mvpProjects.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: new Date(),
  }));

  const livePosts = await getAllPosts();
  const portfolioPosts = await getPortfolioPosts();
  const configured = isHashnodeConfigured();
  const hasRealPortfolioContent = portfolioPosts.length > 0;
  const usingPlaceholders = !configured && !hasRealPortfolioContent;

  // Placeholders are for local dev only (Hashnode not configured and no local posts).
  // When the publication IS configured or we have real local posts we emit no blog
  // routes on failure/empty rather than advertising demo slugs to crawlers.
  let blogPosts: BlogPost[];
  if (usingPlaceholders) {
    blogPosts = placeholderBlogPosts;
  } else if (livePosts.ok) {
    blogPosts = livePosts.data;
  } else {
    blogPosts = [];
  }

  // Merge with portfolio (Velite MDX) posts
  blogPosts = [...blogPosts, ...portfolioPosts];

  const blogRoutes = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
  }));

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}
